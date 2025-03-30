import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import '../styles/KanbanBoard.css';
import { Candidate, Stage } from '../types';
import { getInterviewFlow, getPosition, getPositionCandidates, updateCandidateStage } from '../services/positionService';

// Componente para representar a un candidato
const CandidateCard: React.FC<{ candidate: Candidate }> = ({ candidate }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CANDIDATE',
    item: { id: candidate.id, stageId: candidate.stageId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Renderiza estrellas según la puntuación
  const renderStars = (score: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < score ? "star filled" : "star"}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <Card
      ref={drag}
      className={`candidate-card mb-2 ${isDragging ? 'dragging' : ''}`}
    >
      <Card.Body>
        <Card.Title>{candidate.name}</Card.Title>
        <div className="candidate-score">
          {renderStars(candidate.score)}
        </div>
      </Card.Body>
    </Card>
  );
};

// Componente para representar una columna (fase) del Kanban
const KanbanColumn: React.FC<{
  stage: Stage;
  candidates: Candidate[];
  onDrop: (candidateId: number, stageId: number) => void;
}> = ({ stage, candidates, onDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CANDIDATE',
    drop: (item: { id: number }) => onDrop(item.id, stage.id),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <Col md={4} lg={3} className="mb-4">
      <div
        ref={drop}
        className={`kanban-column p-2 ${isOver ? 'column-over' : ''}`}
      >
        <h5 className="column-header text-center py-2">{stage.name}</h5>
        <div className="candidate-list">
          {candidates
            .filter((candidate) => candidate.stageId === stage.id)
            .map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
        </div>
      </div>
    </Col>
  );
};

// Componente principal Kanban
const KanbanBoard: React.FC = () => {
  const { positionId } = useParams<{ positionId: string }>();
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [position, setPosition] = useState<{ title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!positionId) {
          throw new Error('ID de posición no proporcionado');
        }
        
        const id = parseInt(positionId);
        
        // Carga paralela de datos
        const [stagesData, candidatesData, positionData] = await Promise.all([
          getInterviewFlow(id),
          getPositionCandidates(id),
          getPosition(id)
        ]);
        
        setStages(stagesData.sort((a, b) => a.order - b.order));
        setCandidates(candidatesData);
        setPosition(positionData);
      } catch (err) {
        setError('Error al cargar los datos del proceso de contratación');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [positionId]);

  const handleCandidateDrop = async (candidateId: number, newStageId: number) => {
    try {
      // Encuentra el candidato actual
      const candidate = candidates.find(c => c.id === candidateId);
      
      if (!candidate || candidate.stageId === newStageId) {
        return; // Evita actualizaciones innecesarias
      }
      
      // Actualización optimista de la UI
      setCandidates(prev => 
        prev.map(c => c.id === candidateId ? { ...c, stageId: newStageId } : c)
      );
      
      // Actualiza en el servidor
      await updateCandidateStage(candidateId, newStageId);
    } catch (err) {
      setError('Error al actualizar la fase del candidato');
      
      // Revertir cambios en caso de error
      setCandidates(prev => [...prev]);
      console.error(err);
    }
  };

  const handleGoBack = () => {
    navigate('/positions');
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando proceso de contratación...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {error}
        </Alert>
        <Button variant="secondary" onClick={handleGoBack}>
          Volver a posiciones
        </Button>
      </Container>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Container fluid className="kanban-container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button variant="secondary" onClick={handleGoBack}>
            &larr; Volver
          </Button>
          <h2 className="text-center">{position?.title || 'Proceso de contratación'}</h2>
          <div style={{ width: '100px' }}></div> {/* Espaciador para mantener el título centrado */}
        </div>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Row>
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              candidates={candidates}
              onDrop={handleCandidateDrop}
            />
          ))}
        </Row>
      </Container>
    </DndProvider>
  );
};

export default KanbanBoard;

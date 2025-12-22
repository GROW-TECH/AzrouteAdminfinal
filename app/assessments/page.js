'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Assessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    course: '',
    duration: '',
    date: '',
    startHour: '10',
    startMinute: '00',
    startAMPM: 'AM',
    endHour: '11',
    endMinute: '00',
    endAMPM: 'AM',
    totalMarks: '',
    level: ''
  });

  const [viewingQuestionsFor, setViewingQuestionsFor] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    assessment_id: null,
    type: 'mcq',
    question: '',
    optionsText: '',   // comma-separated for admin input (converted to JSON)
    correctText: '',   // for MCQ: index or exact text; for short: expected string
    explanation: '',
    marks: 1,
    ai_generated: false
  });

  const mapDbToState = (data) =>
    data.map(({ start_time, end_time, total_marks, ...rest }) => {
      // avoid crashing if start_time missing
      const startMatch = (start_time || '10:00 AM').match(/(\d+):(\d+)\s*(AM|PM)/i) || ['','10','00','AM'];
      const endMatch = (end_time || '11:00 AM').match(/(\d+):(\d+)\s*(AM|PM)/i) || ['','11','00','AM'];
      const [, sh, sm, sampm] = startMatch;
      const [, eh, em, eampm] = endMatch;
      return {
        ...rest,
        startHour: sh.toString().padStart(2,'0'),
        startMinute: sm.toString().padStart(2,'0'),
        startAMPM: sampm.toUpperCase(),
        endHour: eh.toString().padStart(2,'0'),
        endMinute: em.toString().padStart(2,'0'),
        endAMPM: eampm.toUpperCase(),
        totalMarks: total_marks
      };
    });

  const mapStateToDb = (data) => ({
    course: data.course,
    duration: data.duration,
    date: data.date,
    start_time: `${data.startHour}:${data.startMinute} ${data.startAMPM}`,
    end_time: `${data.endHour}:${data.endMinute} ${data.endAMPM}`,
    total_marks: Number(data.totalMarks),
    level: data.level
  });

  useEffect(() => {
    fetchAssessments();
  }, []);

  /* ====================
     Assessments CRUD
     ==================== */
  const fetchAssessments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.log('Fetch Error:', error);
      setAssessments([]);
    } else {
      setAssessments(mapDbToState(data || []));
    }
    setLoading(false);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      course: '',
      duration: '',
      date: '',
      startHour: '10',
      startMinute: '00',
      startAMPM: 'AM',
      endHour: '11',
      endMinute: '00',
      endAMPM: 'AM',
      totalMarks: '',
      level: ''
    });
    setShowForm(true);
  };

  const handleEditClick = (a) => {
    setEditingId(a.id);
    setFormData({ ...a });
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'totalMarks') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const dbData = mapStateToDb(formData);

    if (editingId) {
      const { error } = await supabase
        .from('assessments')
        .update(dbData)
        .eq('id', editingId);
      if (error) alert('Update error: ' + error.message);
    } else {
      const { error } = await supabase
        .from('assessments')
        .insert([dbData]);
      if (error) alert('Insert error: ' + error.message);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({
      course: '',
      duration: '',
      date: '',
      startHour: '10',
      startMinute: '00',
      startAMPM: 'AM',
      endHour: '11',
      endMinute: '00',
      endAMPM: 'AM',
      totalMarks: '',
      level: ''
    });
    fetchAssessments();
  };

  const handleDeleteClick = async (id) => {
    if (!confirm('Delete this assessment and all its questions?')) return;
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);
    if (error) alert('Delete error: ' + error.message);
    else fetchAssessments();
  };

  /* ====================
     Questions CRUD
     ==================== */

  // open questions modal for assessment id
  const handleViewQuestions = async (id) => {
    setViewingQuestionsFor(id);
    setQuestionsLoading(true);
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('assessment_id', id)
      .order('id', { ascending: true });

    if (error) {
      alert('Failed to fetch questions: ' + error.message);
      setQuestions([]);
    } else {
      setQuestions(data || []);
    }
    setQuestionsLoading(false);
  };

  const closeQuestions = () => {
    setViewingQuestionsFor(null);
    setQuestions([]);
    setShowAddQuestion(false);
    // reset question form
    setQuestionForm({
      assessment_id: null,
      type: 'mcq',
      question: '',
      optionsText: '',
      correctText: '',
      explanation: '',
      marks: 1,
      ai_generated: false
    });
  };

  // open Add Question modal and prefill assessment id
  const openAddQuestion = (assessmentId) => {
    setShowAddQuestion(true);
    setQuestionForm(prev => ({ ...prev, assessment_id: assessmentId }));
  };

  // add question to DB
  const handleAddQuestionSubmit = async (e) => {
    e.preventDefault();
    const q = questionForm;

    if (!q.assessment_id || !q.question) {
      alert('Please choose assessment and enter the question text.');
      return;
    }

    const payload = {
      assessment_id: q.assessment_id,
      type: q.type,
      question: q.question.trim(),
      options: q.type === 'mcq' ? (q.optionsText ? q.optionsText.split('|').map(o => o.trim()) : null) : null,
      correct: (() => {
        if (q.type === 'mcq') {
          // for mcq allow comma-separated indexes or exact text; admin might enter "1" or "A" or option text
          const c = q.correctText.trim();
          // if numeric index provided -> store as integer index
          if (/^\d+$/.test(c)) return Number(c);
          // if multiple indexes -> array
          if (/,/.test(c)) return c.split(',').map(x => x.trim());
          return c || null;
        } else {
          return q.correctText ? q.correctText.trim() : null;
        }
      })(),
      explanation: q.explanation || null,
      marks: Number(q.marks) || 1,
      ai_generated: !!q.ai_generated
    };

    const { error } = await supabase.from('questions').insert([payload]);
    if (error) {
      alert('Failed to add question: ' + error.message);
      return;
    }

    // refresh questions list for this assessment
    await handleViewQuestions(q.assessment_id);
    // reset add question form
    setQuestionForm({
      assessment_id: null,
      type: 'mcq',
      question: '',
      optionsText: '',
      correctText: '',
      explanation: '',
      marks: 1,
      ai_generated: false
    });
    setShowAddQuestion(false);
  };

  // delete question
  const handleDeleteQuestion = async (id, assessment_id) => {
    if (!confirm('Delete this question?')) return;
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) {
      alert('Failed to delete: ' + error.message);
    } else {
      // refresh
      await handleViewQuestions(assessment_id);
    }
  };

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold">Assessments</h2>
        <button onClick={handleAddClick} className="btn btn-success">+ Add Assessment</button>
      </div>

      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content shadow custom-modal-content">
              <div className="modal-header custom-modal-header">
                <h5 className="modal-title">{editingId ? 'Edit Assessment' : 'Add Assessment'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body custom-modal-body">
                  {['course','duration','date','totalMarks'].map((field) => (
                    <div className="mb-3" key={field}>
                      <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                      <input
                        required
                        type={field==='totalMarks'?'number':field==='date'?'date':'text'}
                        name={field}
                        className="form-control"
                        value={formData[field]}
                        onChange={handleInputChange}
                      />
                    </div>
                  ))}

                  {/* Start Time */}
                  <div className="mb-3">
                    <label className="form-label">Start Time</label>
                    <div className="d-flex gap-2">
                      <select name="startHour" className="form-select" value={formData.startHour} onChange={handleInputChange}>
                        {Array.from({ length: 12 }, (_, i) => <option key={i} value={(i+1).toString().padStart(2,'0')}>{(i+1).toString().padStart(2,'0')}</option>)}
                      </select>
                      <select name="startMinute" className="form-select" value={formData.startMinute} onChange={handleInputChange}>
                        {Array.from({ length: 60 }, (_, i) => <option key={i} value={i.toString().padStart(2,'0')}>{i.toString().padStart(2,'0')}</option>)}
                      </select>
                      <select name="startAMPM" className="form-select" value={formData.startAMPM} onChange={handleInputChange}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  {/* End Time */}
                  <div className="mb-3">
                    <label className="form-label">End Time</label>
                    <div className="d-flex gap-2">
                      <select name="endHour" className="form-select" value={formData.endHour} onChange={handleInputChange}>
                        {Array.from({ length: 12 }, (_, i) => <option key={i} value={(i+1).toString().padStart(2,'0')}>{(i+1).toString().padStart(2,'0')}</option>)}
                      </select>
                      <select name="endMinute" className="form-select" value={formData.endMinute} onChange={handleInputChange}>
                        {Array.from({ length: 60 }, (_, i) => <option key={i} value={i.toString().padStart(2,'0')}>{i.toString().padStart(2,'0')}</option>)}
                      </select>
                      <select name="endAMPM" className="form-select" value={formData.endAMPM} onChange={handleInputChange}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="mb-3">
                    <label className="form-label">Level</label>
                    <select name="level" required className="form-select" value={formData.level} onChange={handleInputChange}>
                      <option value="">Select Level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer custom-modal-footer">
                  <button type="submit" className="btn btn-primary">{editingId?'Update':'Add'}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <>
        <table className="table table-bordered table-striped">
          <thead className="table-secondary">
            <tr>
              <th>S.No</th>
              <th>Course</th>
              <th>Duration</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Total Marks</th>
              <th>Level</th>
              <th>Questions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a, idx) => (
              <tr key={a.id}>
                <td>{idx+1}</td>
                <td>{a.course}</td>
                <td>{a.duration}</td>
                <td>{a.date}</td>
                <td>{`${a.startHour}:${a.startMinute} ${a.startAMPM}`}</td>
                <td>{`${a.endHour}:${a.endMinute} ${a.endAMPM}`}</td>
                <td>{a.totalMarks}</td>
                <td>{a.level}</td>
                <td>
                  <button onClick={() => handleViewQuestions(a.id)} className="btn btn-info btn-sm me-2">View</button>
                  <button onClick={() => openAddQuestion(a.id)} className="btn btn-success btn-sm">+ Add Q</button>
                </td>
                <td>
                  <button onClick={() => handleEditClick(a)} className="btn btn-warning btn-sm me-2">Edit</button>
                  <button onClick={() => handleDeleteClick(a.id)} className="btn btn-danger btn-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Questions Modal */}
        {viewingQuestionsFor && (
          <div className="modal fade show d-block custom-modal-overlay">
            <div className="modal-dialog modal-lg">
              <div className="modal-content shadow custom-modal-content">
                <div className="modal-header custom-modal-header">
                  <h5 className="modal-title">Questions for Assessment #{viewingQuestionsFor}</h5>
                  <button type="button" className="btn-close" onClick={closeQuestions}></button>
                </div>
                <div className="modal-body custom-modal-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Question Bank</h6>
                    <div>
                      <button className="btn btn-sm btn-success me-2" onClick={() => openAddQuestion(viewingQuestionsFor)}>+ Add Question</button>
                      <button className="btn btn-sm btn-secondary" onClick={closeQuestions}>Close</button>
                    </div>
                  </div>

                  {questionsLoading ? <p>Loading questions...</p> :
                  questions.length === 0 ? <p>No questions found.</p> :
                  <ol>
                    {questions.map(q => (
                      <li key={q.id} className="mb-3">
                        <div className="d-flex justify-content-between">
                          <div>
                            <p><strong>Q ({q.type.toUpperCase()} | {q.marks}m):</strong> {q.question}</p>
                            {q.options && Array.isArray(q.options) && (
                              <ul>
                                {q.options.map((opt, i) => <li key={i}>{opt}</li>)}
                              </ul>
                            )}
                            <p className="mb-1"><em>Answer:</em> {formatCorrect(q.correct)}</p>
                            {q.explanation && <p className="text-muted"><small>Explanation: {q.explanation}</small></p>}
                          </div>
                          <div className="text-end">
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuestion(q.id, viewingQuestionsFor)}>Delete</button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>}
                </div>

                <div className="modal-footer custom-modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeQuestions}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Question Modal */}
        {showAddQuestion && (
          <div className="modal fade show d-block custom-modal-overlay">
            <div className="modal-dialog modal-lg">
              <div className="modal-content shadow custom-modal-content">
                <div className="modal-header custom-modal-header">
                  <h5 className="modal-title">Add Question</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddQuestion(false)}></button>
                </div>

                <form onSubmit={handleAddQuestionSubmit}>
                  <div className="modal-body custom-modal-body">
                    <div className="mb-3">
                      <label className="form-label">Assessment ID</label>
                      <input className="form-control" value={questionForm.assessment_id || ''} readOnly />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Question Type</label>
                      <select className="form-select" name="type" value={questionForm.type} onChange={(e) => setQuestionForm(prev => ({ ...prev, type: e.target.value }))}>
                        <option value="mcq">MCQ</option>
                        <option value="short">Short Answer</option>
                        <option value="essay">Essay</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Question Text</label>
                      <textarea required className="form-control" value={questionForm.question} onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))} />
                    </div>

                    {questionForm.type === 'mcq' && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Options (use | as separator)</label>
                          <input className="form-control" placeholder="e.g. King moves|Queen moves|Knight fork|Bishop pin" value={questionForm.optionsText} onChange={(e) => setQuestionForm(prev => ({ ...prev, optionsText: e.target.value }))}/>
                          <small className="form-text text-muted">Separate options using <code>|</code>. Example: <code>A|B|C|D</code></small>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Correct (index or exact text)</label>
                          <input className="form-control" placeholder="e.g. 1  (first option) or Knight fork" value={questionForm.correctText} onChange={(e) => setQuestionForm(prev => ({ ...prev, correctText: e.target.value }))}/>
                          <small className="form-text text-muted">If you enter a number it will be saved as index; else exact text.</small>
                        </div>
                      </>
                    )}

                    {questionForm.type !== 'mcq' && (
                      <div className="mb-3">
                        <label className="form-label">Expected Answer (optional)</label>
                        <input className="form-control" value={questionForm.correctText} onChange={(e) => setQuestionForm(prev => ({ ...prev, correctText: e.target.value }))}/>
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label">Marks</label>
                      <input type="number" className="form-control" value={questionForm.marks} onChange={(e) => setQuestionForm(prev => ({ ...prev, marks: e.target.value }))}/>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Explanation (optional)</label>
                      <textarea className="form-control" value={questionForm.explanation} onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}></textarea>
                    </div>

                    <div className="mb-3 form-check">
                      <input id="ai_gen" className="form-check-input" type="checkbox" checked={questionForm.ai_generated} onChange={(e)=>setQuestionForm(prev=>({...prev, ai_generated:e.target.checked}))}/>
                      <label className="form-check-label" htmlFor="ai_gen">AI generated</label>
                    </div>
                  </div>

                  <div className="modal-footer custom-modal-footer">
                    <button type="submit" className="btn btn-primary">Add Question</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddQuestion(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        </>
      )}

      <style jsx>{`
        .custom-modal-overlay {
          background: rgba(0,0,0,0.4);
          position: fixed !important;
          top: 0; left: 0; width: 100vw; height: 100vh;
          display: flex; justify-content: center; align-items: center;
          z-index: 1050;
        }
        .custom-modal-content {
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        .custom-modal-header, .custom-modal-footer {
          flex-shrink: 0;
          position: sticky;
          background: #fff;
          z-index: 1;
        }
        .custom-modal-header { top: 0; }
        .custom-modal-footer { bottom: 0; }
        .custom-modal-body { overflow-y: auto; max-height: 70vh; }
      `}</style>
    </div>
  );
}

/* ========== helpers ========== */
function formatCorrect(correct) {
  if (correct == null) return '—';
  if (Array.isArray(correct)) return correct.join(', ');
  if (typeof correct === 'object') return JSON.stringify(correct);
  return String(correct);
}

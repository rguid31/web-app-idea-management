import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';

const IdeaBoard = ({ user }) => {
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState('');

  // Read ideas from Firestore
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'ideas'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ideasData = [];
        querySnapshot.forEach((doc) => {
          ideasData.push({ ...doc.data(), id: doc.id });
        });
        setIdeas(ideasData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Create a new idea
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newIdea.trim() === '') return;
    await addDoc(collection(db, 'ideas'), {
      text: newIdea,
      userId: user.uid,
      createdAt: new Date(),
    });
    setNewIdea('');
  };

  // Delete an idea
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'ideas', id));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Welcome, {user.email}</h2>
      <form onSubmit={handleSubmit} className="mb-6 flex">
        <input
          type="text"
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder="What's your next big idea?"
          className="flex-grow p-2 bg-slate-700 rounded-l border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r">
          Add Idea
        </button>
      </form>
      <div>
        {ideas.map((idea) => (
          <div key={idea.id} className="bg-slate-800 p-4 rounded-lg mb-3 flex justify-between items-center shadow">
            <p>{idea.text}</p>
            <button onClick={() => handleDelete(idea.id)} className="text-red-500 hover:text-red-400 font-bold">
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IdeaBoard;

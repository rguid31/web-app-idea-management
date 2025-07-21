// src/components/CommentsSection.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function (m) {
    return (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m] || m
    );
  });
}

export default function CommentsSection({ ideaId, user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);
  const [open, setOpen] = useState(false); // <-- Add this line

  // Fetch comments for this idea
  useEffect(() => {
    if (!ideaId) return;
    const q = query(
      collection(db, "ideas", ideaId, "comments"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setComments(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [ideaId]);

  // Fetch username from users collection if logged in
  useEffect(() => {
    async function fetchUsername() {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUsername(userDoc.data().username);
          }
        } catch (error) {
          console.error("Error fetching username:", error);
        }
      }
    }
    fetchUsername();
  }, [user]);

  // Handle posting a new comment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addDoc(collection(db, "ideas", ideaId, "comments"), {
        text: newComment.trim(),
        author: username || user?.displayName || user?.email || "Anonymous",
        timestamp: serverTimestamp(),
      });
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment: " + error.message);
    }
  };

  return (
    <div className="comments-section" style={{ marginTop: "1rem" }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          background: "#334155",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          marginBottom: "0.5rem",
        }}
      >
        {open ? "Hide Comments" : "Show Comments"}
      </button>
      {open && (
        <div>
          <h4>Comments</h4>
          {loading ? (
            <div>Loading comments...</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {comments.map((c) => (
                <li key={c.id} style={{ marginBottom: "0.5rem" }}>
                  <strong>{c.author || "Anonymous"}</strong>:{" "}
                  <span
                    dangerouslySetInnerHTML={{
                      __html: escapeHTML(c.text),
                    }}
                  />
                  <br />
                  <small>
                    {c.timestamp?.toDate
                      ? c.timestamp.toDate().toLocaleString()
                      : ""}
                  </small>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleSubmit} style={{ marginTop: "0.5rem" }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              style={{ width: "70%" }}
            />
            <button type="submit" style={{ marginLeft: "0.5rem" }}>
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

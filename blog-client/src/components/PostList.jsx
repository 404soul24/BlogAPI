import { useEffect, useState } from 'react';
import { api } from 'ui-kit/api';
import { navigate } from '../router.jsx';
import PostCard from './PostCard.jsx';

export default function PostList() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    api
      .listPosts()
      .then((data) => live && setPosts(data.posts))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, []);

  if (error) {
    return (
      <div className="alert alert-error" role="alert">
        {error}
      </div>
    );
  }

  if (!posts) {
    return <p className="muted">Loading posts…</p>;
  }

  if (posts.length === 0) {
    return (
      <div className="empty card">
        <p>No posts published yet.</p>
      </div>
    );
  }

  return (
    <section className="stack post-list">
      <h1 className="visually-hidden">All posts</h1>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onOpen={() => navigate(`/posts/${post.id}`)} />
      ))}
    </section>
  );
}

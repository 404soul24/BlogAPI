import { formatDate } from '../format.js';

export default function PostCard({ post, onOpen }) {
  const commentCount = post._count?.comments ?? 0;

  return (
    <article className="card post-card">
      <button className="post-card-open" onClick={onOpen}>
        <h2 className="post-card-title">{post.title}</h2>
      </button>

      <p className="post-card-meta muted">
        <span>{formatDate(post.createdAt)}</span>
        <span aria-hidden="true">·</span>
        <span>
          {post.author?.name}
          {commentCount > 0 && (
            <>
              <span aria-hidden="true">·</span> <span>{commentCount}</span>
              {commentCount === 1 ? ' comment' : ' comments'}
            </>
          )}
        </span>
      </p>
    </article>
  );
}

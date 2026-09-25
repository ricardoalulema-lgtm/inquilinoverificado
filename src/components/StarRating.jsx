import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const StarRating = ({ value = 0, onChange, readonly = false }) => {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (starValue) => {
    if (!readonly && onChange) {
      onChange(starValue);
    }
  };

  const getIcon = (star) => {
    if (value >= star) return <FaStar className="star-filled" />;
    if (value >= star - 0.5) return <FaStarHalfAlt className="star-filled" />;
    return <FaRegStar className="star-empty" />;
  };

  return (
    <div className="star-rating" style={{ display: 'inline-flex', gap: '0.15rem' }}>
      {stars.map((star) => (
        <span
          key={star}
          onClick={() => handleClick(star)}
          style={{
            cursor: readonly ? 'default' : 'pointer',
            fontSize: '1.25rem',
            color: value >= star ? '#ffc107' : (value >= star - 0.5 ? '#ffc107' : '#adb5bd'),
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!readonly) e.currentTarget.style.color = '#ffc107';
          }}
          onMouseLeave={(e) => {
            if (!readonly) e.currentTarget.style.color = value >= star ? '#ffc107' : (value >= star - 0.5 ? '#ffc107' : '#adb5bd');
          }}
        >
          {getIcon(star)}
        </span>
      ))}
    </div>
  );
};

export default StarRating;

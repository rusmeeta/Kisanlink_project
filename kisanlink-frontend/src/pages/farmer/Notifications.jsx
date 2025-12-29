import { useNavigate } from "react-router-dom";

const NotificationItem = ({ notification }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to messages page and pass farmer_id as query param
    navigate(`/consumer/messages?farmer_id=${notification.farmer_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="p-3 border-b cursor-pointer hover:bg-gray-100"
    >
      <h4 className="font-semibold">{notification.title}</h4>
      <p className="text-sm text-gray-500">{notification.message}</p>
    </div>
  );
};

export default NotificationItem;

import React from "react";
import Button from "react-bootstrap/Button";

interface ShortcutProps {
  name: string;
  icon: string;
  onClick: () => void;
}

export const Shortcut: React.FC<ShortcutProps> = ({ name, icon, onClick }) => {
  return (
    <Button
      variant="outline-light"
      onClick={onClick}
      aria-label={`Open in ${name}`}
      className="m-0 p-0"
      title={`Open in ${name}`}
    >
      <img src={icon} />
    </Button>
  );
};

export default Shortcut;

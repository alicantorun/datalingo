import React, { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

// Define a type for the props
interface DroppableProps {
  children: ReactNode;
  id: string;
}

function Droppable(props: DroppableProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
  });

  const style = {
    color: isOver ? "green" : undefined,
  };

  return (
    <div className="w-full h-full" ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}

export default Droppable;

interface NodeInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NodeInfoPopupProps {
  id: string; //id of the node
}

function NodeInfoPopup({ id, isOpen, onClose }: NodeInfoPopupProps) {
  if (!isOpen) return null;
  console.log(id);

  return (
    <div
      className="fixed inset-0 bg-black/65 flex items-center justify-center z-1000"
      onClick={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        className="bg-[#1b1b1d] p-6 rounded shadow-lg w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4 select-none">
          Coming soon.....
        </h2>
        <div
          className="select-none py-2 px-4 text-lg font-semibold uppercase rounded-md bg-[#2a9d5f] text-white hover:bg-[#3bc77b] cursor-pointer transition-colors duration-200"
          onClick={() => {
            onClose();
          }}
        >
          Close
        </div>
      </div>
    </div>
  );
}
export default NodeInfoPopup;

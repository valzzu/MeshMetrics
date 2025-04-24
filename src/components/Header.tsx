interface HeaderProps {
  onlineCount: number;
  offlineCount: number;
  nodesCount?: number; // Optional, if you want to keep total count
}

function Header({ onlineCount, offlineCount, nodesCount }: HeaderProps) {
  return (
    <div className="fixed top-0 left-0 w-full bg-gray-800 text-white p-4 border-b border-gray-700 z-50">
      <div className="flex justify-between items-center">
        <div className="text-lg select-none">
          Nodes: {nodesCount ?? onlineCount + offlineCount} (Online:{" "}
          {onlineCount}, Offline: {offlineCount})
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold select-none">
          Mesh Metrics
        </div>
      </div>
    </div>
  );
}

export default Header;

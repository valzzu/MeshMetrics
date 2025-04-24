import { useState } from "react";

interface HeaderProps {
  online: any[];
  offline: any[];
}

const Header = ({ online, offline }: HeaderProps) => {
  // State to manage mobile menu visibility
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  // Node count display component for reuse
  const NodeCount = () => (
    <div className="text-lg select-none">
      Nodes: {online.length + offline.length} (Online: {online.length}, Offline:{" "}
      {offline.length})
    </div>
  );

  return (
    <div className="fixed top-0 left-0 w-full bg-gray-800 text-white p-4 border-b border-gray-700 z-[1000]">
      <div className="flex justify-between items-center">
        <div className="hidden md:block">
          <NodeCount />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold select-none">
          Mesh Metrics
        </div>
        <nav className="hidden md:flex gap-4">
          <a
            href="/"
            className="hover:text-gray-300 transition-colors duration-200"
          >
            Home
          </a>
          <a
            href="/map"
            className="hover:text-gray-300 transition-colors duration-200"
          >
            Map
          </a>
        </nav>
        <button
          className="md:hidden text-2xl focus:outline-none "
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>
      </div>
      {isMenuOpen && (
        <div className="md:hidden mt-4 z-[1000] relative bg-gray-800">
          <div className="py-2 px-4">
            <NodeCount />
          </div>
          <nav className="flex flex-col gap-2">
            <a
              href="/"
              className="py-2 px-4 hover:bg-gray-700 rounded transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="/map"
              className="py-2 px-4 hover:bg-gray-700 rounded transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Map
            </a>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Header;

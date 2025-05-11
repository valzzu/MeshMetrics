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
    <div className="text-base select-none">
      Nodes: {online.length + offline.length} (Online: {online.length}, Offline:{" "}
      {offline.length}) │ Address: mqtt.meshtastic.org │ Status: 🟢 Online ⚫
      Offline
    </div>
  );

  return (
    <div className="fixed top-0 left-0 w-full bg-[#1b1b1d] text-white p-4 border-none z-[1000]">
      <div className="flex justify-between items-center">
        <div className="hidden md:block">
          <NodeCount />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold select-none">
          Mesh Metrics @ Valzzu3D
        </div>
        <nav className="hidden md:flex gap-8">
          <a
            href="/"
            className="text-lg font-semibold uppercase rounded-md bg-[#2a9d5f] text-white px-3 py-2 hover:bg-[#3bc77b] cursor-pointer transition-colors duration-200"
          >
            Home
          </a>
          <a
            href="/map"
            className="text-lg font-semibold uppercase rounded-md bg-[#2a9d5f] text-white px-3 py-2 hover:bg-[#3bc77b] cursor-pointer transition-colors duration-200"
          >
            Map
          </a>
        </nav>
        <button
          className="md:hidden text-2xl focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>
      </div>
      {isMenuOpen && (
        <div className="md:hidden mt-4 z-[1000] relative bg-[#1b1b1d]">
          <div className="py-2 px-4">
            <NodeCount />
          </div>
          <nav className="flex flex-col gap-8">
            <a
              href="/"
              className="py-2 px-4 text-lg font-semibold uppercase rounded-md bg-[#2a9d5f] text-white hover:bg-[#3bc77b] cursor-pointer transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="/map"
              className="py-2 px-4 text-lg font-semibold uppercase rounded-md bg-[#2a9d5f] text-white hover:bg-[#3bc77b] cursor-pointer transition-colors duration-200"
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

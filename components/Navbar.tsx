import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-black text-white px-8 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold tracking-tight">
        Rubenius Multimedia
      </Link>
      <ul className="flex gap-8 text-sm font-medium">
        <li>
          <Link href="/" className="hover:text-gray-300 transition-colors">
            Home
          </Link>
        </li>
        <li>
          <Link href="/main-screen" className="hover:text-gray-300 transition-colors">
            Main Screen
          </Link>
        </li>
        <li>
          <Link href="/playlists" className="hover:text-gray-300 transition-colors">
            Playlists
          </Link>
        </li>
        <li>
          <Link href="/playlist-builder" className="hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-lg transition-all">
            Playlist Builder
          </Link>
        </li>
      </ul>
    </nav>
  );
}

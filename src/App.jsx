import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Music from "./pages/Music";
import Lyrics from "./pages/Lyrics";
import Artists from "./pages/Artists";
import Categories from "./pages/Categories";
import Blog from "./pages/Blog";
import Search from "./pages/Search";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Copyright from "./pages/Copyright";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/music" element={<Music />} />
          <Route path="/lyrics" element={<Lyrics />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/search" element={<Search />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/copyright" element={<Copyright />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;

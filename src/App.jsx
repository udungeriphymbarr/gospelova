import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Music from "./pages/Music";
import Lyrics from "./pages/Lyrics";
import Artists from "./pages/Artists";
import CategoryDetails from "./pages/CategoryDetails";

import Blog from "./pages/Blog";
import BlogDetails from "./pages/BlogDetails";
import Search from "./pages/Search";
import Contact from "./pages/Contact";
import Copyright from "./pages/Copyright";
import SongDetails from "./pages/SongDetails";
import ArtistDetails from "./pages/ArtistDetails";

import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import AddSong from "./admin/AddSong";
import ManageSongs from "./admin/ManageSongs";
import AdminRoute from "./admin/AdminRoute";
import EditSong from "./admin/EditSong";
import ManageArtists from "./admin/ManageArtists";
import AddArtist from "./admin/AddArtist";
import EditArtist from "./admin/EditArtist";
import ManageCategories from "./admin/ManageCategories";
import AddCategory from "./admin/AddCategory";
import EditCategory from "./admin/EditCategory";
import BlogManagement from "./admin/BlogManagement";
import ContactMessages from "./admin/ContactMessages";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Admin routes: outside the public website layout */}

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/songs"
          element={
            <AdminRoute>
              <ManageSongs />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/songs/new"
          element={
            <AdminRoute>
              <AddSong />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/songs/edit/:id"
          element={
            <AdminRoute>
              <EditSong />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/artists"
          element={
            <AdminRoute>
              <ManageArtists />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/artists/new"
          element={
            <AdminRoute>
              <AddArtist />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/artists/edit/:id"
          element={
            <AdminRoute>
              <EditArtist />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <ManageCategories />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/categories/new"
          element={
            <AdminRoute>
              <AddCategory />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/categories/edit/:id"
          element={
            <AdminRoute>
              <EditCategory />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/blog"
          element={
            <AdminRoute>
              <BlogManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/blog/new"
          element={
            <AdminRoute>
              <BlogManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/blog/edit/:id"
          element={
            <AdminRoute>
              <BlogManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/messages"
          element={
            <AdminRoute>
              <ContactMessages />
            </AdminRoute>
          }
        />

        {/* Public website routes */}
        <Route
          path="/*"
          element={
            <MainLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/music" element={<Music />} />
                <Route path="/lyrics" element={<Lyrics />} />
                <Route path="/music/:slug" element={<SongDetails />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/artists/:slug" element={<ArtistDetails />} />
                <Route path="/categories/:slug" element={<CategoryDetails />} />

                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetails />} />
                <Route path="/search" element={<Search />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/copyright" element={<Copyright />} />
              </Routes>
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

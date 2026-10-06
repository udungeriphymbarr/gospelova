import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function MainLayout({ children }) {
  return (
    <div className="app">
      <Navbar />

      <main>{children}</main>

      <Footer />
    </div>
  );
}

export default MainLayout;

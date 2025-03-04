import "./App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import useAxios from "./hooks/useAxios";

function App() {
  useAxios();
  return <RouterProvider router={router} />;
}

export default App;

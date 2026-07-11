import { RouterProvider } from "react-router-dom";
import router from "./Routers/AppRouter";

function App() {
  return <RouterProvider router={router} />;
}

export default App;

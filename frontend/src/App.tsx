import { Button } from "antd";
import { useUser } from "./context/UserContext";

function App() {
  const {getKeys} = useUser();

  return (
    <div>
      <h3>Hello</h3>
      <Button type="primary" onClick={getKeys}>Get keys</Button>
    </div>
  )
}

export default App

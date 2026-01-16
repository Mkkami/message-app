import { Button } from "antd";
import { Link } from "react-router";
import { useUser } from "./context/UserContext";

function App() {
  const {getKeys} = useUser();

  return (
    <div>
      <h3>Hello</h3>
      <Button type="primary" onClick={getKeys}>Get keys</Button>
      <Button type="link"><Link to="/send">Send message</Link></Button>
    </div>
  )
}

export default App

import { Button, Flex } from "antd";
import { Link } from "react-router";
import { useUser } from "./context/UserContext";

function App() {
  const {getKeys} = useUser();

  return (
    <Flex vertical gap="large" justify="center" align="center">
      <Button type="primary" onClick={getKeys}>Get keys</Button>
      <Button type="link"><Link to="/login">Login</Link></Button>
      <Button type="link"><Link to="/register">Register</Link></Button>
      <Button type="link"><Link to="/send">Send message</Link></Button>
      <Button type="link"><Link to="/inbox">Inbox</Link></Button>
    </Flex>
  )
}

export default App

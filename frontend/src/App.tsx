import { Button, Flex } from "antd";
import { Link } from "react-router";

function App() {

  return (
    <Flex style={{height: "100vh"}} justify="center" align="center">
      <Flex vertical gap="large" justify="center" align="center">
        <Button type="default"><Link to="/login">Login</Link></Button>
        <Button type="default"><Link to="/register">Register</Link></Button>
        <Button type="default"><Link to="/send">Send message</Link></Button>
        <Button type="default"><Link to="/inbox">Inbox</Link></Button>
      </Flex>
    </Flex>
  )
}

export default App

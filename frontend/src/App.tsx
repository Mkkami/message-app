import { Button, Flex } from "antd";
import { useNavigate } from "react-router";

function App() {
  const navigate = useNavigate();

  return (
    <Flex style={{height: "100vh"}} justify="center" align="center">
      <Flex vertical gap="large" justify="center" align="center">
        <Button type="default" onClick={() => navigate('/login')}>Login</Button>
        <Button type="default" onClick={() => navigate('/register')}>Register</Button>
        <Button type="default" onClick={() => navigate('/send')}>Send message</Button>
        <Button type="default" onClick={() => navigate('/inbox')}>Inbox</Button>
      </Flex>
    </Flex>
  )
}

export default App

import { MailOutlined } from "@ant-design/icons";
import { Flex, Spin } from "antd";

function App() {

  return (
    <Flex style={{height: "100vh"}} justify="center" align="center">
      <Spin indicator={<MailOutlined spin style={{fontSize: "5rem"}} />} />
    </Flex>
  )
}

export default App

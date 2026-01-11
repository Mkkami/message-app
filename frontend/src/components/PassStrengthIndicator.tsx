import { InfoCircleOutlined } from "@ant-design/icons";
import type { ZxcvbnResult } from "@zxcvbn-ts/core";
import { List, Progress, Typography } from "antd";

interface Props {
    result: ZxcvbnResult;
}

function PasswordStrengthIndicator({ result }: Props) {
    const { Text, Title } = Typography;

    return (
        <div>
            <Title level={4}>Security</Title>
            <Text type="secondary">
                Your password protects your private keys. A strong password is essential for keeping them secure.
            </Text>

            <div style={{ marginTop: 20}}>
                <Text strong>Password strength: </Text>
                <Progress
                    percent={(result.score + 1) * 20}
                    steps={5}
                    strokeColor={['#ff4d4f', '#ff7a45', '#ffa940', '#bae637', '#52c41a']}
                    showInfo={false}
                />
            </div>

            <List
                header={<Text strong>General tips:</Text>}
                bordered={false}
                dataSource={[
                    "Longer passwords are better then short, complex ones.",
                    "Avoid common words and patterns.",
                    "Avoid using personal information.",
                ]}
                renderItem={item =>(
                    <List.Item key={item} style={{ padding: '4px 0', border: 'none'}}>
                        <Text><InfoCircleOutlined/> {item}</Text>
                    </List.Item>
                )}
                />
            <List
                header={<Text strong>Tips for you:</Text>}
                bordered={false}
                dataSource={result.feedback.suggestions.length > 0 ? result.feedback.suggestions : ["Good job! Your password looks strong."]}
                renderItem={item =>(
                    <List.Item key={item} style={{ padding: '4px 0', border: 'none'}}>
                        <Text><InfoCircleOutlined/> {item}</Text>
                    </List.Item>
                )}
                />
        </div>
    )
}
export default PasswordStrengthIndicator;
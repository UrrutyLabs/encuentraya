import { useLocalSearchParams } from "expo-router";
import { OrderChatScreen } from "@screens/job/OrderChatScreen";

export default function JobChatPage() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const orderId = jobId;

  return <OrderChatScreen orderId={orderId ?? ""} isPro />;
}

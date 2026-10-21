import { useParams } from "react-router-dom";
import ThreadsList from "./ThreadsList";
import ThreadView from "./ThreadView";

export default function MessagesPage() {
  const { threadId } = useParams<{ threadId: string }>();
  return (
    <div className="flex h-full w-full overflow-hidden">
      <ThreadsList activeThreadId={threadId} />
      {threadId ? (
        <ThreadView threadId={threadId} />
      ) : (
        <div className="flex h-full flex-1 items-center justify-center text-center">
          <div>
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="mt-1 text-xs text-muted-foreground">Choose a thread from the left to read or reply.</p>
          </div>
        </div>
      )}
    </div>
  );
}

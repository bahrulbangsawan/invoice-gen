import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useCVData } from "@/components/ai/cv-data-context";
import type { CVData } from "@/components/cv-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
  unstable_useMentionContext,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BriefcaseBusinessIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  CrosshairIcon,
  DownloadIcon,
  LightbulbIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  SparklesIcon,
  SquareIcon,
  TextIcon,
} from "lucide-react";
import type { FC } from "react";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
      style={{
        ["--thread-max-width" as string]: "44rem",
        ["--composer-radius" as string]: "16px",
        ["--composer-padding" as string]: "6px",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-3 pt-3"
      >
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <ThreadPrimitive.Messages>
          {() => <ThreadMessage />}
        </ThreadPrimitive.Messages>

        <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-2 overflow-visible rounded-t-(--composer-radius) bg-background pb-3">
          <ThreadScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);
  if (isEditing) return <EditComposer />;
  if (role === "user") return <UserMessage />;
  return <AssistantMessage />;
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:border-border dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col justify-center gap-6 px-2 py-6">
      <div className="aui-thread-welcome-center flex flex-col items-center gap-3 text-center">
        <div className="fade-in zoom-in-75 animate-in fill-mode-both flex size-10 items-center justify-center rounded-xl bg-primary/10 duration-300">
          <SparklesIcon className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-semibold text-base tracking-tight duration-200">
            CV Assistant
          </h1>
          <p className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground text-xs delay-75 duration-200">
            Improve, generate, or tailor your CV content
          </p>
        </div>
      </div>
      <ThreadSuggestions />
    </div>
  );
};

const WELCOME_SUGGESTIONS = [
  {
    icon: TextIcon,
    title: "Write a @summary",
    description: "Generate a professional summary",
    prompt:
      "Write a professional @summary based on my experience and skills. Keep it 3-4 sentences.",
    isDisabled: (d: CVData) =>
      d.experience.length === 0 && d.skills.length === 0,
  },
  {
    icon: BriefcaseBusinessIcon,
    title: "Strengthen @experience",
    description: "Add metrics and action verbs",
    prompt:
      "Review my @experience bullet points and rewrite them using strong action verbs and quantifiable achievements.",
    isDisabled: (d: CVData) => d.experience.length === 0,
  },
  {
    icon: LightbulbIcon,
    title: "Optimize @skills",
    description: "Suggest missing skills for my role",
    prompt:
      "Review my @skills and suggest any important skills I might be missing for my role.",
    isDisabled: (d: CVData) => d.skills.length === 0,
  },
  {
    icon: CrosshairIcon,
    title: "Tailor for a job posting",
    description: "Paste a job description to optimize",
    prompt:
      "I want to tailor my CV for a specific role. Here's the job description: ",
    isDisabled: (d: CVData) =>
      !d.summary &&
      d.experience.length === 0 &&
      d.skills.length === 0 &&
      d.education.length === 0,
  },
];

const ThreadSuggestions: FC = () => {
  const aui = useAui();
  const cvData = useCVData();

  function handleSuggestion(prompt: string) {
    const send = !prompt.endsWith(": ") && !prompt.endsWith(" ");
    if (send) {
      aui.thread().append({
        content: [{ type: "text", text: prompt }],
      });
    } else {
      aui.composer().setText(prompt);
    }
  }

  return (
    <div className="aui-thread-welcome-suggestions grid w-full grid-cols-2 gap-2 overflow-hidden pb-2">
      {WELCOME_SUGGESTIONS.map((s, i) => {
        const Icon = s.icon;
        const disabled = cvData ? s.isDisabled(cvData) : true;
        return (
          <div
            key={s.title}
            className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both min-w-0 duration-200"
            style={{ animationDelay: `${100 + i * 50}ms` }}
          >
            <Button
              variant="ghost"
              disabled={disabled}
              onClick={() => handleSuggestion(s.prompt)}
              className="group h-auto w-full flex-col items-start justify-start gap-1.5 overflow-hidden rounded-xl border bg-background px-2.5 py-2 text-left text-xs shadow-xs transition-all hover:bg-muted hover:shadow-sm disabled:pointer-events-none disabled:opacity-40"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted transition-colors group-hover:bg-primary/10">
                <Icon className="size-3 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <div className="flex w-full min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium text-xs leading-tight">
                  {s.title}
                </span>
                <span className="truncate text-[0.625rem] leading-tight text-muted-foreground">
                  {s.description}
                </span>
              </div>
            </Button>
          </div>
        );
      })}
    </div>
  );
};

const CV_MENTION_ITEMS = [
  { id: "summary", type: "cv-section", label: "Summary" },
  { id: "experience", type: "cv-section", label: "Experience" },
  { id: "education", type: "cv-section", label: "Education" },
  { id: "skills", type: "cv-section", label: "Skills" },
  { id: "awards", type: "cv-section", label: "Awards" },
  { id: "certificates", type: "cv-section", label: "Certificates" },
  { id: "languages", type: "cv-section", label: "Languages" },
  { id: "personal-info", type: "cv-section", label: "Personal Info" },
  { id: "projects", type: "cv-section", label: "Projects" },
  { id: "volunteer", type: "cv-section", label: "Volunteer" },
];

const cvMentionFormatter = {
  serialize(item: { id: string; label: string }) {
    return `@${item.id}`;
  },
  parse(text: string) {
    const segments: Array<
      | { readonly kind: "text"; readonly text: string }
      | {
          readonly kind: "mention";
          readonly type: string;
          readonly label: string;
          readonly id: string;
        }
    > = [];
    const mentionIds = CV_MENTION_ITEMS.map((i) => i.id).join("|");
    const regex = new RegExp(`@(${mentionIds})\\b`, "g");
    let lastIndex = 0;
    let m = regex.exec(text);
    while (m !== null) {
      if (m.index > lastIndex) {
        segments.push({ kind: "text", text: text.slice(lastIndex, m.index) });
      }
      const id = m[1];
      const item = CV_MENTION_ITEMS.find((i) => i.id === id);
      segments.push({
        kind: "mention",
        type: "cv-section",
        label: item?.label ?? id,
        id,
      });
      lastIndex = regex.lastIndex;
      m = regex.exec(text);
    }
    if (lastIndex < text.length) {
      segments.push({ kind: "text", text: text.slice(lastIndex) });
    }
    return segments;
  },
};

const cvMentionAdapter = {
  categories() {
    // Each section is its own "category" so they show immediately on @
    return CV_MENTION_ITEMS.map((item) => ({
      id: item.id,
      label: item.label,
    }));
  },
  categoryItems(categoryId: string) {
    return CV_MENTION_ITEMS.filter((item) => item.id === categoryId);
  },
  search(query: string) {
    if (!query) return CV_MENTION_ITEMS;
    const q = query.toLowerCase();
    return CV_MENTION_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    );
  },
};

const MentionComposerInput: FC = () => {
  const { open } = unstable_useMentionContext();
  const composerText = useAuiState((s) => s.composer.text);
  const mentionValid = MENTION_PATTERN.test(composerText);

  return (
    <ComposerPrimitive.Input
      placeholder="Type @ to mention a section..."
      className="aui-composer-input max-h-24 min-h-8 w-full resize-none bg-transparent px-1.5 py-1 text-xs outline-none placeholder:text-muted-foreground/80"
      rows={1}
      autoFocus
      aria-label="Message input"
      onKeyDown={(e) => {
        if (open) return;
        if (e.key === "Enter" && !e.shiftKey && !mentionValid) {
          e.preventDefault();
        }
      }}
    />
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
      <ComposerPrimitive.AttachmentDropzone asChild>
        <div
          data-slot="composer-shell"
          className="flex w-full flex-col gap-2 rounded-(--composer-radius) border bg-background p-(--composer-padding) transition-shadow focus-within:border-ring/75 focus-within:ring-2 focus-within:ring-ring/20 data-[dragging=true]:border-ring data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50"
        >
          <ComposerAttachments />
          <ComposerPrimitive.Unstable_MentionRoot adapter={cvMentionAdapter} formatter={cvMentionFormatter}>
            <MentionComposerInput />
            <ComposerPrimitive.Unstable_MentionPopover className="z-50 w-44 overflow-hidden rounded-md border bg-popover p-1 shadow-md">
              <ComposerPrimitive.Unstable_MentionCategories>
                {(categories) =>
                  categories.map((cat) => (
                    <ComposerPrimitive.Unstable_MentionCategoryItem
                      key={cat.id}
                      categoryId={cat.id}
                      className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1 text-xs outline-none hover:bg-accent data-[highlighted]:bg-primary data-[highlighted]:!text-white"
                    >
                      @{cat.label}
                    </ComposerPrimitive.Unstable_MentionCategoryItem>
                  ))
                }
              </ComposerPrimitive.Unstable_MentionCategories>
              <ComposerPrimitive.Unstable_MentionItems>
                {(items) =>
                  items.map((item, i) => (
                    <ComposerPrimitive.Unstable_MentionItem
                      key={item.id}
                      item={item}
                      index={i}
                      className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1 text-xs outline-none hover:bg-accent data-[highlighted]:bg-primary data-[highlighted]:!text-white"
                    >
                      @{item.label}
                    </ComposerPrimitive.Unstable_MentionItem>
                  ))
                }
              </ComposerPrimitive.Unstable_MentionItems>
            </ComposerPrimitive.Unstable_MentionPopover>
          </ComposerPrimitive.Unstable_MentionRoot>
          <ComposerAction />
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};

const MENTION_PATTERN =
  /@(summary|experience|education|skills|awards|certificates|languages|personal-info|projects|volunteer)\b/;

const ComposerAction: FC = () => {
  const hasMention = useAuiState((s) => MENTION_PATTERN.test(s.composer.text));

  return (
    <div className="aui-composer-action-wrapper relative flex items-center justify-between">
      <div className="flex items-center gap-1">
        <ComposerAddAttachment />
        {!hasMention && (
          <span className="text-[0.625rem] text-muted-foreground">
            Use @ to mention a section
          </span>
        )}
      </div>
      <AuiIf condition={(s) => !s.thread.isRunning}>
        {hasMention ? (
          <ComposerPrimitive.Send asChild>
            <TooltipIconButton
              tooltip="Send message"
              side="bottom"
              type="button"
              variant="default"
              size="icon"
              className="aui-composer-send size-7 rounded-full"
              aria-label="Send message"
            >
              <ArrowUpIcon className="aui-composer-send-icon size-4" />
            </TooltipIconButton>
          </ComposerPrimitive.Send>
        ) : (
          <TooltipIconButton
            tooltip="Mention a @section first"
            side="bottom"
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-send size-7 rounded-full opacity-30"
            aria-label="Send message"
            disabled
          >
            <ArrowUpIcon className="aui-composer-send-icon size-4" />
          </TooltipIconButton>
        )}
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel size-7 rounded-full"
            aria-label="Stop generating"
          >
            <SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-1.5 rounded-md border border-destructive bg-destructive/10 p-2 text-destructive text-xs dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-1.5 duration-150"
      data-role="assistant"
    >
      <div className="aui-assistant-message-content wrap-break-word px-1.5 text-foreground text-xs leading-relaxed">
        <MessagePrimitive.Parts>
          {({ part }) => {
            if (part.type === "text") return <MarkdownText />;
            if (part.type === "tool-call")
              return part.toolUI ?? <ToolFallback {...part} />;
            return null;
          }}
        </MessagePrimitive.Parts>
        <MessageError />
      </div>

      <div className="aui-assistant-message-footer mt-1 ml-2 flex min-h-6 items-center">
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger asChild>
          <TooltipIconButton
            tooltip="More"
            className="data-[state=open]:bg-accent"
          >
            <MoreHorizontalIcon />
          </TooltipIconButton>
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          className="aui-action-bar-more-content z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <ActionBarPrimitive.ExportMarkdown asChild>
            <ActionBarMorePrimitive.Item className="aui-action-bar-more-item flex cursor-pointer select-none items-center gap-1.5 rounded-sm px-2 py-1 text-xs outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <DownloadIcon className="size-3" />
              Export as Markdown
            </ActionBarMorePrimitive.Item>
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-1 px-1.5 py-1.5 duration-150 [&:where(>*)]:col-start-2"
      data-role="user"
    >
      <UserMessageAttachments />

      <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
        <div className="aui-user-message-content wrap-break-word rounded-xl bg-muted px-3 py-2 text-xs text-foreground">
          <MessagePrimitive.Parts />
        </div>
        <div className="aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
          <UserActionBar />
        </div>
      </div>

      <BranchPicker className="aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="aui-user-action-edit p-4">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2 py-1.5">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input min-h-8 w-full resize-none bg-transparent p-2.5 text-foreground text-xs outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-2 mb-2 flex items-center gap-1.5 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="xs">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="xs">Update</Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

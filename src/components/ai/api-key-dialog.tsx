import { useState } from "react"
import { KeyRound, ExternalLink, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useApiKey, maskApiKey } from "./use-api-key"

export function ApiKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { apiKey, setApiKey, clearApiKey } = useApiKey()
  const [input, setInput] = useState("")
  const [error, setError] = useState("")

  const hasKey = apiKey.length > 0

  function handleSave() {
    const trimmed = input.trim()
    if (!trimmed) {
      setError("Please enter an API key")
      return
    }
    setApiKey(trimmed)
    setInput("")
    setError("")
    onOpenChange(false)
  }

  function handleClear() {
    clearApiKey()
    setInput("")
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            OpenRouter API Key
          </DialogTitle>
          <DialogDescription>
            Your key is stored locally in this browser and never sent to our
            servers.
          </DialogDescription>
        </DialogHeader>

        {hasKey ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <code className="text-sm text-muted-foreground">
                {maskApiKey(apiKey)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 size-4" />
                Clear
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your key is active. Clear it to enter a new one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-or-..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setError("")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave()
                }}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline hover:text-foreground"
            >
              Get your API key at openrouter.ai
              <ExternalLink className="size-3" />
            </a>
          </div>
        )}

        <DialogFooter>
          {!hasKey && (
            <Button onClick={handleSave} disabled={!input.trim()}>
              Save Key
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

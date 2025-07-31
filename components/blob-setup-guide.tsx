"use client"

import { AlertTriangle } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

export function BlobSetupGuide() {
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-6">
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-amber-800">Vercel Blob Storage Not Configured</h3>
          <p className="text-sm text-amber-700">
            Images are currently stored temporarily and will not persist between sessions.
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="setup">
          <AccordionTrigger className="text-sm text-amber-800 font-medium">
            How to set up Vercel Blob Storage
          </AccordionTrigger>
          <AccordionContent className="text-sm text-amber-700 space-y-2">
            <p>Follow these steps to configure Vercel Blob Storage:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Go to your Vercel dashboard and select your project</li>
              <li>Navigate to the "Storage" tab</li>
              <li>Click on "Connect Blob"</li>
              <li>Follow the setup instructions</li>
              <li>Once created, go to "Settings" → "Environment Variables"</li>
              <li>
                Add a new environment variable named{" "}
                <code className="bg-amber-100 px-1 py-0.5 rounded">BLOB_READ_WRITE_TOKEN</code>
              </li>
              <li>Copy the token from the Blob dashboard and paste it as the value</li>
              <li>Save and redeploy your application</li>
            </ol>
            <div className="pt-2">
              <Button
                variant="outline"
                className="text-xs h-8 bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                onClick={() => window.open("https://vercel.com/docs/storage/vercel-blob", "_blank")}
              >
                View Vercel Blob Documentation
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

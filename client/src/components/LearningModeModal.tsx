import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // Not used for now, but available
  DialogClose,  // Not used directly, close button is part of DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getLearningTopic, LearningTopic } from '@/lib/learningContent';

interface LearningModeModalProps {
  topicId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const LearningModeModal: React.FC<LearningModeModalProps> = ({ topicId, isOpen, onClose }) => {
  if (!isOpen || !topicId) {
    return null;
  }

  const topic = getLearningTopic(topicId);

  if (!topic) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Learning content for topic ID "{topicId}" not found.
          </DialogDescription>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl mb-2">{topic.title}</DialogTitle>
        </DialogHeader>
        {/* Using dangerouslySetInnerHTML because content is trusted HTML from our own source */}
        <div
          className="text-sm text-muted-foreground space-y-2 prose prose-sm max-w-none" // Added prose for basic HTML styling
          dangerouslySetInnerHTML={{ __html: topic.explanation }}
        />
        <DialogFooter className="mt-4">
          {/* DialogClose is automatically part of DialogContent (top right X) */}
          {/* <Button variant="outline" onClick={onClose}>Close</Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LearningModeModal;

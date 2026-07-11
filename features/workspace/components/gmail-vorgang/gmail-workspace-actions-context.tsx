"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";

type ReviewHandlers = {
  openReplyReview?: () => void;
  openArchiveReview?: () => void;
  openAppointmentReview?: () => void;
};

type GmailWorkspaceActionsContextValue = {
  registerReviewHandlers: (handlers: ReviewHandlers) => () => void;
  triggerReplyReview: () => void;
  triggerArchiveReview: () => void;
  triggerAppointmentReview: () => void;
};

const GmailWorkspaceActionsContext =
  createContext<GmailWorkspaceActionsContextValue | null>(null);

export function GmailWorkspaceActionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const handlersRef = useRef<ReviewHandlers>({});

  const registerReviewHandlers = useCallback((handlers: ReviewHandlers) => {
    handlersRef.current = { ...handlersRef.current, ...handlers };
    return () => {
      if (handlers.openReplyReview === handlersRef.current.openReplyReview) {
        delete handlersRef.current.openReplyReview;
      }
      if (handlers.openArchiveReview === handlersRef.current.openArchiveReview) {
        delete handlersRef.current.openArchiveReview;
      }
      if (
        handlers.openAppointmentReview === handlersRef.current.openAppointmentReview
      ) {
        delete handlersRef.current.openAppointmentReview;
      }
    };
  }, []);

  const triggerReplyReview = useCallback(() => {
    handlersRef.current.openReplyReview?.();
  }, []);

  const triggerArchiveReview = useCallback(() => {
    handlersRef.current.openArchiveReview?.();
  }, []);

  const triggerAppointmentReview = useCallback(() => {
    handlersRef.current.openAppointmentReview?.();
  }, []);

  const value = useMemo(
    () => ({
      registerReviewHandlers,
      triggerReplyReview,
      triggerArchiveReview,
      triggerAppointmentReview,
    }),
    [registerReviewHandlers, triggerReplyReview, triggerArchiveReview, triggerAppointmentReview]
  );

  return (
    <GmailWorkspaceActionsContext.Provider value={value}>
      {children}
    </GmailWorkspaceActionsContext.Provider>
  );
}

export function useGmailWorkspaceActions(): GmailWorkspaceActionsContextValue | null {
  return useContext(GmailWorkspaceActionsContext);
}

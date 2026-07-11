"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { UserAvatar } from "@/components/user-menu/UserAvatar";
import { UserDropdown } from "@/components/user-menu/UserDropdown";
import { useUserProfileContext } from "@/lib/user/components/user-profile-context";
import { signOut } from "@/lib/auth/auth";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export function UserMenu() {
  const router = useRouter();
  const { profile } = useUserProfileContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateDropdownPosition();
  }, [open, updateDropdownPosition]);

  useEffect(() => {
    if (!open) return;

    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open, updateDropdownPosition]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;

      closeMenu();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);

    document.addEventListener("keydown", handleEscape);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, closeMenu]);

  const handleToggle = () => {
    setOpen((current) => !current);
  };

  const handleSignOut = async () => {
    setError(null);
    setIsSigningOut(true);

    const { error: authError } = await signOut();

    if (authError) {
      setError(getAuthErrorMessage(authError));
      setIsSigningOut(false);
      return;
    }

    closeMenu();
    router.push(AUTH_ROUTES.login);
    router.refresh();
  };

  const dropdown =
    open && mounted ? (
      <div
        ref={dropdownRef}
        style={{
          position: "fixed",
          top: dropdownPosition.top,
          right: dropdownPosition.right,
          zIndex: 200,
        }}
      >
        <UserDropdown
          name={profile.name}
          email={profile.email}
          companyName={profile.companyName}
          error={error}
          isSigningOut={isSigningOut}
          onClose={closeMenu}
          onSignOut={handleSignOut}
        />
      </div>
    ) : null;

  return (
    <>
      <div className="relative z-[110]" ref={menuRef}>
        <UserAvatar
          name={profile.name}
          email={profile.email}
          avatarUrl={profile.avatarUrl}
          isOpen={open}
          onClick={handleToggle}
        />
      </div>

      {dropdown && createPortal(dropdown, document.body)}
    </>
  );
}

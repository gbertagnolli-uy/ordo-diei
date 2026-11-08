import type { User } from "@opencircle/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMention } from "../../mention/hooks/useMention";

export const usePostMention = (
	content: string,
	setContent: (content: string) => void,
) => {
	const [showMentions, setShowMentions] = useState(false);
	const [mentionQuery, setMentionQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [cursorPosition, setCursorPosition] = useState(0);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const { users, isLoading } = useMention(mentionQuery);

	const handleContentChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const newContent = e.target.value;
			const cursorPos = e.target.selectionStart;
			setContent(newContent);
			setCursorPosition(cursorPos);

			// Check if we're typing a mention
			const beforeCursor = newContent.substring(0, cursorPos);
			const mentionMatch = beforeCursor.match(/@(\w*)$/);

			if (mentionMatch) {
				setMentionQuery(mentionMatch[1]);
				setShowMentions(true);
				setSelectedIndex(0);
			} else {
				setShowMentions(false);
				setMentionQuery("");
			}
		},
		[setContent],
	);

	const handleMentionSelect = useCallback(
		(user: User) => {
			if (!textareaRef.current) return;

			const beforeCursor = content.substring(0, cursorPosition);
			const afterCursor = content.substring(cursorPosition);
			const mentionMatch = beforeCursor.match(/@(\w*)$/);

			if (mentionMatch) {
				const newContent =
					beforeCursor.substring(0, mentionMatch.index) +
					`@${user.username} ` +
					afterCursor;

				setContent(newContent);
				setShowMentions(false);
				setMentionQuery("");

				// Set cursor position after the mention
				const newCursorPos =
					(mentionMatch.index || 0) + `@${user.username} `.length;
				setTimeout(() => {
					if (textareaRef.current) {
						textareaRef.current.focus();
						textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
					}
				}, 0);
			}
		},
		[content, cursorPosition, setContent],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (!showMentions || users.length === 0) return;

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) => (prev + 1) % users.length);
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
					break;
				case "Enter":
				case "Tab":
					e.preventDefault();
					if (users[selectedIndex]) {
						handleMentionSelect(users[selectedIndex]);
					}
					break;
				case "Escape":
					e.preventDefault();
					setShowMentions(false);
					setMentionQuery("");
					break;
			}
		},
		[showMentions, users, selectedIndex, handleMentionSelect],
	);

	// Close mentions when clicking outside
	useEffect(() => {
		const handleClickOutside = () => {
			setShowMentions(false);
			setMentionQuery("");
		};

		if (showMentions) {
			document.addEventListener("click", handleClickOutside);
			return () => document.removeEventListener("click", handleClickOutside);
		}
	}, [showMentions]);

	return {
		textareaRef,
		showMentions,
		users,
		isLoading,
		selectedIndex,
		cursorPosition,
		handleContentChange,
		handleMentionSelect,
		handleKeyDown,
		setShowMentions,
		setMentionQuery,
		setSelectedIndex,
		setCursorPosition,
	};
};

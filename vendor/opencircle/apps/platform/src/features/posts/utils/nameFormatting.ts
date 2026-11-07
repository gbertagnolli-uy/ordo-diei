export const getShortenedName = (name: string): string => {
	const words = name.trim().split(/\s+/);
	let result: string;

	if (words.length === 1) {
		result = words[0];
	} else if (words.length === 2) {
		result = `${words[0]} ${words[1]}`;
	} else {
		// For names with 3+ words, return first two words
		result = `${words[0]} ${words[1]}`;
	}

	// Truncate if still too long (max 12 characters per name)
	if (result.length > 12) {
		return `${result.substring(0, 12)}...`;
	}

	return result;
};

export const formatCommentSummary = (names: string[]): string | null => {
	if (!names || names.length === 0) return null;

	const shortenedNames = names.map((name) => getShortenedName(name));

	if (shortenedNames.length === 1) {
		return `${shortenedNames[0]} commented`;
	}

	if (shortenedNames.length === 2) {
		return `${shortenedNames[0]} & ${shortenedNames[1]} commented`;
	}

	if (shortenedNames.length === 3) {
		return `${shortenedNames[0]}, ${shortenedNames[1]} and ${shortenedNames[2]} commented`;
	}

	// More than 3 names
	const visibleNames = shortenedNames.slice(0, 2);
	const remainingCount = names.length - 2;
	return `${visibleNames.join(", ")} and ${remainingCount} others commented`;
};

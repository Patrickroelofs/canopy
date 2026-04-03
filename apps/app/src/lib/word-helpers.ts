class WordHelpers {
	public getInitials(name?: string | null, email?: string | null) {
		const value = name?.trim() || email?.trim() || "User";
		const words = value.split(/\s+/).filter(Boolean);

		if (words.length === 1) {
			return words[0].slice(0, 2);
		}

		return words
			.slice(0, 2)
			.map((word) => word[0])
			.join("");
	}
}

export const wordHelpers = new WordHelpers();

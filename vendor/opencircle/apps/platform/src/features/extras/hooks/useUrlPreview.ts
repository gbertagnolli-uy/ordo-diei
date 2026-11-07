import type { UrlPreview } from "@opencircle/core";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../../../utils/api";
import { parseUrls } from "../../posts/utils/contentParsing";

export const useUrlPreview = (content: string) => {
	const urls = useMemo(() => {
		const urlMatches = parseUrls(content);
		return urlMatches.filter((match) => match.isUrl).map((match) => match.url);
	}, [content]);

	const queries = useQueries({
		queries: urls.map((url) => ({
			queryKey: ["url-preview", url],
			queryFn: () => api.extras.getUrlPreview(url),
			enabled: !!url,
		})),
	});

	const previews = useMemo(() => {
		const previewMap: Record<string, UrlPreview> = {};
		queries.forEach((query, index) => {
			if (query.data) {
				previewMap[urls[index]] = query.data;
			}
		});
		return previewMap;
	}, [queries, urls]);

	return {
		previews,
		isLoading: queries.some((query) => query.isLoading),
		errors: queries
			.map((query) => query.error)
			.filter((error): error is Error => error !== null),
	};
};

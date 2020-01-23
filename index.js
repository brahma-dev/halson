((module, win) => {
	let baseURL = "";

	class HALSONResource {
		constructor(data = {}) {
			if (typeof data === "string") {
				data = JSON.parse(data);
			}

			for (const attr in data) {
				if (!(attr in this) && data.hasOwnProperty(attr)) {
					this[attr] = data[attr];
				}
			}

			if (this._embedded && typeof this._embedded === "object") {
				const _embedded = {};
				const self = this;
				Object.keys(this._embedded).forEach((key) => {
					if (self._embedded.hasOwnProperty(key)) {
						if (Array.isArray(self._embedded[key])) {
							_embedded[key] = []
								.concat(self._embedded[key])
								.map((embed) => createHALSONResource(embed));
						} else {
							_embedded[key] = createHALSONResource(self._embedded[key]);
						}
					}
				});

				this._embedded = _embedded;
			}
		}

		_invert(filterCallback) {
			return function(...args) {
				return !filterCallback.apply(null, args);
			};
		}

		listLinkRels() {
			return this._links ? Object.keys(this._links) : [];
		}

		listEmbedRels() {
			return this._embedded ? Object.keys(this._embedded) : [];
		}

		getLinks(rel, filterCallback, begin, end) {
			if (!this._links || !(rel in this._links)) {
				return [];
			}

			let links = [].concat(this._links[rel]);

			if (filterCallback) {
				links = links.filter(filterCallback);
			}

			return links.slice(begin || 0, end || links.length);
		}

		getLink(rel, filterCallback, def) {
			if (typeof filterCallback !== "function") {
				def = filterCallback;
				filterCallback = null;
			}
			return this.getLinks(rel, filterCallback, 0, 1)[0] || def;
		}

		getEmbeds(rel, filterCallback, begin, end) {
			if (!this._embedded || !(rel in this._embedded)) {
				return [];
			}

			let items = [].concat(this._embedded[rel]);

			if (filterCallback) {
				items = items.filter(filterCallback);
			}

			return items.slice(begin || 0, end || items.length);
		}

		getEmbed(rel, filterCallback, def) {
			if (typeof filterCallback !== "function") {
				def = filterCallback;
				filterCallback = null;
			}
			return this.getEmbeds(rel, filterCallback, 0, 1)[0] || def;
		}

		addLink(rel, link) {
			link = baseURL + link;
			if (typeof link === "string") {
				link = { href: link };
			}

			if (!this._links) {
				this._links = {};
			}

			if (!(rel in this._links)) {
				// single link
				this._links[rel] = link;
			} else {
				// multiple links
				this._links[rel] = [].concat(this._links[rel]);
				this._links[rel].push(link);
			}

			return this;
		}

		addEmbed(rel, embed) {
			return this.insertEmbed(rel, -1, embed);
		}

		insertEmbed(rel, index, embed) {
			if (!this._embedded) {
				this._embedded = {};
			}

			if (!(rel in this._embedded)) {
				this._embedded[rel] = Array.isArray(embed)
					? embed.map(createHALSONResource)
					: createHALSONResource(embed);
				return this;
			}

			const items = [].concat(embed).map(createHALSONResource);

			this._embedded[rel] = [].concat(this._embedded[rel]);

			if (index < 0) {
				Array.prototype.push.apply(this._embedded[rel], items);
			} else {
				const params = [index, 0].concat(items);
				Array.prototype.splice.apply(this._embedded[rel], params);
			}

			return this;
		}

		removeLinks(rel, filterCallback) {
			if (!this._links || !(rel in this._links)) {
				return;
			}

			if (!filterCallback) {
				delete this._links[rel];
			} else {
				this._links[rel] = []
					.concat(this._links[rel])
					.filter(this._invert(filterCallback));
			}

			return this;
		}

		removeEmbeds(rel, filterCallback) {
			if (!this._embedded || !(rel in this._embedded)) {
				return;
			}

			if (!filterCallback) {
				return delete this._embedded[rel];
			}

			this._embedded[rel] = []
				.concat(this._embedded[rel])
				.filter(this._invert(filterCallback));

			return this;
		}
	}

	HALSONResource.prototype.className = "HALSONResource";

	let createHALSONResource = (data) => {
		if (data && data.className === HALSONResource.prototype.className) {
			return data;
		}
		return new HALSONResource(data);
	};

	createHALSONResource.Resource = HALSONResource;
	createHALSONResource.setBaseURL = (url) => {
		baseURL = url;
	};

	if (module) {
		module.exports = createHALSONResource;
	} else if (win) {
		win.halson = createHALSONResource;
	}
})(
	typeof module === "undefined" ? null : module,
	typeof window === "undefined" ? null : window
);

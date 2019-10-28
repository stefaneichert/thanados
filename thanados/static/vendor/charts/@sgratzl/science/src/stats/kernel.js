// See <http://en.wikipedia.org/wiki/Kernel_(statistics)>.
export function uniform(u) {
	if (u <= 1 && u >= -1) return .5;
	return 0;
}

export function triangular(u) {
	if (u <= 1 && u >= -1) return 1 - Math.abs(u);
	return 0;
}

export function epanechnikov(u) {
	if (u <= 1 && u >= -1) return .75 * (1 - u * u);
	return 0;
}

export function quartic(u) {
	if (u <= 1 && u >= -1) {
		const tmp = 1 - u * u;
		return (15 / 16) * tmp * tmp;
	}
	return 0;
}

export function triweight(u) {
	if (u <= 1 && u >= -1) {
		const tmp = 1 - u * u;
		return (35 / 32) * tmp * tmp * tmp;
	}
	return 0;
}

export function gaussian(u) {
	return 1 / Math.sqrt(2 * Math.PI) * Math.exp(-.5 * u * u);
}

export function cosine(u) {
	if (u <= 1 && u >= -1) return Math.PI / 4 * Math.cos(Math.PI / 2 * u);
	return 0;
}

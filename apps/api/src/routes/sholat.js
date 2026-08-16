const BASE = 'https://api.myquran.com/v2/sholat';

export const jadwal = async (req, res) => {
	const { city, date } = req.query;

	if (!city || !/^\d{3,6}$/.test(String(city))) {
		return res.status(422).json({ error: 'query param "city" (id kota myquran) is required' });
	}

	if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
		return res.status(422).json({ error: 'query param "date" (YYYY-MM-DD) is required' });
	}

	const upstream = await fetch(`${BASE}/jadwal/${city}/${date}`);

	if (!upstream.ok) {
		throw new Error(`myquran jadwal failed: ${upstream.status} ${upstream.statusText}`);
	}

	const payload = await upstream.json();

	if (!payload || payload.status !== true || !payload.data) {
		throw new Error(`myquran jadwal returned an error envelope: ${JSON.stringify(payload)}`);
	}

	res.json({
		lokasi: payload.data.lokasi,
		daerah: payload.data.daerah,
		jadwal: payload.data.jadwal,
	});
};

export const kota = async (req, res) => {
	const upstream = await fetch(`${BASE}/kota/semua`);

	if (!upstream.ok) {
		throw new Error(`myquran kota failed: ${upstream.status} ${upstream.statusText}`);
	}

	const payload = await upstream.json();

	if (!payload || payload.status !== true || !Array.isArray(payload.data)) {
		throw new Error(`myquran kota returned an error envelope: ${JSON.stringify(payload)}`);
	}

	res.json({ items: payload.data });
};

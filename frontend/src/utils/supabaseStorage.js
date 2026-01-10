import { supabase } from '../config/supabase';

const BUCKET_NAME = 'portfolio';

export async function uploadImage(file, userId) {
	if (!file) {
		throw new Error('Archivo de imagen requerido');
	}
	if (!userId) {
		throw new Error('userId es requerido para generar la ruta de la imagen');
	}

	const safeName = file.name || 'image';
	const path = `${userId}/${Date.now()}_${safeName}`;

	const { error: uploadError } = await supabase
		.storage
		.from(BUCKET_NAME)
		.upload(path, file, {
			cacheControl: '3600',
			upsert: false,
		});

	if (uploadError) {
		console.error('Error subiendo imagen a Supabase Storage:', uploadError);
		throw uploadError;
	}

	const { data: publicData } = supabase
		.storage
		.from(BUCKET_NAME)
		.getPublicUrl(path);

	return publicData?.publicUrl || null;
}

export async function deleteImage(imageUrl) {
	if (!imageUrl) return;

	try {
		const withoutQuery = imageUrl.split('?')[0];
		const marker = `/${BUCKET_NAME}/`;
		const index = withoutQuery.indexOf(marker);
		if (index === -1) {
			console.warn('No se pudo extraer la ruta del archivo desde la URL');
			return;
		}

		const path = withoutQuery.substring(index + marker.length);
		if (!path) return;

		const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
		if (error) {
			console.error('Error eliminando imagen en Supabase Storage:', error);
		}
	} catch (err) {
		console.error('Error procesando la URL de la imagen para eliminarla:', err);
	}
}

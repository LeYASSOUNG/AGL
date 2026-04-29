package com.quicklodge.service;

import com.quicklodge.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Décode les data URLs (JPEG/PNG/WebP), écrit sous {@code app.upload.dir}, supprime les fichiers.
 */
@Service
public class EtablissementPhotoStorageService {

    /** Navigateurs varient : image/jpeg, image/jpg, image/pjpeg, image/x-png, etc. */
    private static final Pattern DATA_URL = Pattern.compile(
            "^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    public static final int MAX_PHOTOS_PER_ETABLISSEMENT = 12;
    public static final int MAX_PHOTOS_PER_CHAMBRE = 12;
    public static final int MAX_DECODED_BYTES_PER_PHOTO = 5 * 1024 * 1024;
    /** Avatar utilisateur : même décodage, fichier dédié sous {@code user-avatars/{userId}/}. */
    public static final int MAX_DECODED_BYTES_AVATAR = 3 * 1024 * 1024;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public Path uploadRoot() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public DecodedImage parseDataUrl(String dataUrl) {
        if (dataUrl == null || dataUrl.isBlank()) {
            throw new BadRequestException("Photo vide");
        }
        Matcher m = DATA_URL.matcher(dataUrl.trim());
        if (!m.matches()) {
            throw new BadRequestException("Format de photo invalide (JPEG, PNG ou WebP en data URL attendu)");
        }
        String mime = m.group(1).trim().toLowerCase(Locale.ROOT);
        if (!isAllowedImageMime(mime)) {
            throw new BadRequestException("Type d'image non pris en charge : " + m.group(1).trim());
        }
        String b64 = m.group(2).replaceAll("\\s", "");
        byte[] raw;
        try {
            raw = Base64.getDecoder().decode(b64);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Encodage base64 de la photo invalide");
        }
        if (raw.length > MAX_DECODED_BYTES_PER_PHOTO) {
            throw new BadRequestException("Chaque photo doit faire au plus 5 Mo");
        }
        if (raw.length == 0) {
            throw new BadRequestException("Photo vide");
        }
        String ext = extensionForMime(mime);
        return new DecodedImage(raw, ext);
    }

    public DecodedImage parseDataUrlAvatar(String dataUrl) {
        DecodedImage img = parseDataUrl(dataUrl);
        if (img.data().length > MAX_DECODED_BYTES_AVATAR) {
            throw new BadRequestException("L'avatar doit faire au plus 3 Mo");
        }
        return img;
    }

    private static boolean isAllowedImageMime(String mime) {
        return mime.equals("image/jpeg")
                || mime.equals("image/jpg")
                || mime.equals("image/jpe")
                || mime.equals("image/pjpeg")
                || mime.equals("image/png")
                || mime.equals("image/x-png")
                || mime.equals("image/webp");
    }

    private static String extensionForMime(String mime) {
        if (mime.contains("png")) {
            return "png";
        }
        if (mime.contains("webp")) {
            return "webp";
        }
        return "jpg";
    }

    /**
     * @return chemin relatif sous la racine d'upload, ex. {@code etablissement-photos/3/uuid.jpg}
     */
    public String saveFile(long etablissementId, DecodedImage image) {
        Path root = uploadRoot();
        Path dir = root.resolve("etablissement-photos").resolve(String.valueOf(etablissementId));
        try {
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "." + image.extension();
            Path target = dir.resolve(filename);
            Files.write(target, image.data());
            return "etablissement-photos/" + etablissementId + "/" + filename;
        } catch (IOException e) {
            throw new BadRequestException("Enregistrement de la photo impossible");
        }
    }

    /**
     * @return chemin relatif sous la racine d'upload, ex. {@code chambre-photos/3/uuid.jpg}
     */
    public String saveChambreFile(long chambreId, DecodedImage image) {
        Path root = uploadRoot();
        Path dir = root.resolve("chambre-photos").resolve(String.valueOf(chambreId));
        try {
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "." + image.extension();
            Path target = dir.resolve(filename);
            Files.write(target, image.data());
            return "chambre-photos/" + chambreId + "/" + filename;
        } catch (IOException e) {
            throw new BadRequestException("Enregistrement de la photo impossible");
        }
    }

    /**
     * @return chemin relatif, ex. {@code service-photos/3/uuid.jpg}
     */
    public String saveServiceFile(long serviceId, DecodedImage image) {
        Path root = uploadRoot();
        Path dir = root.resolve("service-photos").resolve(String.valueOf(serviceId));
        try {
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "." + image.extension();
            Path target = dir.resolve(filename);
            Files.write(target, image.data());
            return "service-photos/" + serviceId + "/" + filename;
        } catch (IOException e) {
            throw new BadRequestException("Enregistrement de la photo impossible");
        }
    }

    /**
     * @return chemin relatif sous la racine d'upload, ex. {@code user-avatars/5/uuid.jpg}
     */
    public String saveUserAvatarFile(long userId, DecodedImage image) {
        Path root = uploadRoot();
        Path dir = root.resolve("user-avatars").resolve(String.valueOf(userId));
        try {
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "." + image.extension();
            Path target = dir.resolve(filename);
            Files.write(target, image.data());
            return "user-avatars/" + userId + "/" + filename;
        } catch (IOException e) {
            throw new BadRequestException("Enregistrement de l'avatar impossible");
        }
    }

    public void deleteStoredFile(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return;
        }
        Path root = uploadRoot();
        Path target = root.resolve(storagePath).normalize();
        if (!target.startsWith(root)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // fichier déjà absent ou verrou : on ignore
        }
    }

    public record DecodedImage(byte[] data, String extension) {}
}

<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

final class AcademyEmailPolicy
{
    /** @var array<int, string> */
    private const ALLOWED_DOMAINS = [
        'ac-aix-marseille.fr',
        'ac-amiens.fr',
        'ac-besancon.fr',
        'ac-bordeaux.fr',
        'ac-caen.fr',
        'ac-clermont.fr',
        'ac-corse.fr',
        'ac-creteil.fr',
        'ac-dijon.fr',
        'ac-dijon.f',
        'ac-grenoble.fr',
        'ac-guadeloupe.fr',
        'ac-guyane.fr',
        'ac-reunion.fr',
        'ac-lille.fr',
        'ac-limoges.fr',
        'ac-lyon.fr',
        'ac-martinique.fr',
        'ac-mayotte.fr',
        'ac-montpellier.fr',
        'ac-nancy-metz.fr',
        'ac-nantes.fr',
        'ac-nice.fr',
        'ac-noumea.nc',
        'ac-orleans-tours.fr',
        'ac-paris.fr',
        'ac-poitiers.fr',
        'ac-polynesie.pf',
        'ac-reims.fr',
        'ac-rennes.fr',
        'ac-rouen.fr',
        'ac-spm.fr',
        'ac-strasbourg.fr',
        'ac-toulouse.fr',
        'ac-versailles.fr',
        'ac-wf.wf',
    ];

    public function isAllowedTeacherEmail(string $email): bool
    {
        $email = strtolower(trim($email));
        if (false === filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $domain = (string) substr($email, strrpos($email, '@') + 1);
        $domain = trim($domain);
        if ('' === $domain) {
            return false;
        }

        if (\in_array($domain, self::ALLOWED_DOMAINS, true)) {
            return true;
        }

        if (str_starts_with($domain, 'www.')) {
            $withoutWww = substr($domain, 4);

            return \in_array($withoutWww, self::ALLOWED_DOMAINS, true);
        }

        return false;
    }
}

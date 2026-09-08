window.TECHNO_CONFIG = {

    /* =====================================================
       ANNÉE SCOLAIRE
       ===================================================== */

    academicYear: {
        start: '2026-09-01',
        end: '2027-07-02',

        // La semaine du 31 août 2026 est une semaine A
        weekAReference: '2026-08-31'
    },


    /* =====================================================
       JOURS FÉRIÉS
       ===================================================== */

    holidays: {
        '2026-11-01': 'Toussaint',
        '2026-11-11': 'Armistice 1918',
        '2026-12-25': 'Noël',
        '2027-01-01': 'Jour de l\'An',
        '2027-03-29': 'Lundi de Pâques',
        '2027-05-01': 'Fête du Travail',
        '2027-05-06': 'Ascension',
        '2027-05-08': 'Victoire 1945',
        '2027-05-17': 'Lundi de Pentecôte'
    },


    /* =====================================================
       FERMETURES EXCEPTIONNELLES COMMUNES
       ===================================================== */

    globalClosures: {
        '2027-05-07': 'Pont de l\'Ascension - Pas de cours'
    },


    /* =====================================================
       VACANCES
       ===================================================== */

    vacations: [
        {
            start: '2026-10-17',
            end: '2026-11-01',
            name: 'Vacances de la Toussaint'
        },
        {
            start: '2026-12-19',
            end: '2027-01-03',
            name: 'Vacances de Noël'
        },
        {
            start: '2027-02-13',
            end: '2027-02-28',
            name: 'Vacances d\'hiver'
        },
        {
            start: '2027-04-10',
            end: '2027-04-25',
            name: 'Vacances de printemps'
        },
        {
            start: '2027-07-03',
            end: '2027-09-01',
            name: 'Vacances d\'été'
        }
    ],


    /* =====================================================
       ÉTABLISSEMENTS
       ===================================================== */

    establishments: {


        /* =================================================
           COLLÈGE DU LUNDI

           Les horaires restent à compléter.
           ================================================= */

        'college-lundi': {

            label: 'Collège du lundi',

            courses: {


                /* -------------------------
                   5e
                   ------------------------- */

                '5e': {

                    slots: [
                        {
                            day: 1,
                            weeks: 'all',
                            time: 'Horaire à compléter'
                        }
                    ],

                    exceptions: []
                },


                /* -------------------------
                   4e
                   ------------------------- */

                '4e': {

                    slots: [
                        {
                            day: 1,
                            weeks: 'all',
                            time: 'Horaire à compléter'
                        }
                    ],

                    exceptions: []
                },


                /* -------------------------
                   3e
                   ------------------------- */

                '3e': {

                    slots: [
                        {
                            day: 1,
                            weeks: 'all',
                            time: 'Horaire à compléter'
                        }
                    ],

                    exceptions: []
                }
            }
        },



        /* =================================================
           COLLÈGE DU JEUDI / VENDREDI
           ================================================= */

        'college-jv': {

            label: 'Collège du jeudi / vendredi',

            courses: {


                /* -------------------------
                   5e
                   ------------------------- */

                '5e': {

                    slots: [

                        // Tous les vendredis
                        {
                            day: 5,
                            weeks: 'all',
                            time: '13h45 à 14h40',
                            order: 1
                        },

                        // Deuxième heure uniquement semaine A
                        {
                            day: 5,
                            weeks: 'A',
                            time: '15h50 à 16h45',
                            order: 2
                        }

                    ],

                    exceptions: []
                },


                /* -------------------------
                   4e
                   ------------------------- */

                '4e': {

                    defaultGroup: 'g1',

                    groups: {


                        /* GROUPE 1 */

                        'g1': {

                            label: 'Groupe 1',

                            slots: [

                                {
                                    day: 4,
                                    weeks: 'all',
                                    time: '9h20 à 10h15',
                                    order: 1
                                },

                                {
                                    day: 5,
                                    weeks: 'A',
                                    time: '14h40 à 15h35',
                                    order: 2
                                }

                            ],

                            exceptions: []
                        },


                        /* GROUPE 2 */

                        'g2': {

                            label: 'Groupe 2',

                            slots: [

                                {
                                    day: 4,
                                    weeks: 'all',
                                    time: '10h30 à 11h25',
                                    order: 1
                                },

                                {
                                    day: 5,
                                    weeks: 'B',
                                    time: '15h50 à 16h45',
                                    order: 2
                                }

                            ],

                            exceptions: []
                        }
                    }
                },


                /* -------------------------
                   3e
                   ------------------------- */

                '3e': {

                    slots: [

                        {
                            day: 4,
                            weeks: 'all',
                            time: '8h25 à 9h20',
                            order: 1
                        },

                        {
                            day: 5,
                            weeks: 'B',
                            time: '14h40 à 15h35',
                            order: 2
                        }

                    ],

                    exceptions: []
                }
            }
        }
    }
};
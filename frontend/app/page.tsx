import Link from 'next/link'

export default function PageAccueil() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-5xl w-full">
        {/* Titre principal */}
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-900">
          🏨 Plateforme de Réservation
        </h1>
        <h2 className="text-2xl text-center mb-12 text-gray-600">
          Hébergements Touristiques en Côte d'Ivoire
        </h2>

        {/* Cartes de fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Rechercher</h3>
            <p className="text-gray-600">
              Trouvez l'hébergement parfait parmi nos établissements certifiés
            </p>
          </div>

          <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">Réserver</h3>
            <p className="text-gray-600">
              Réservez en ligne facilement et en toute sécurité avec paiement mobile
            </p>
          </div>

          <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold mb-2">Évaluer</h3>
            <p className="text-gray-600">
              Partagez votre expérience et aidez les autres voyageurs
            </p>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/etablissements" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-center transition-colors shadow-lg"
          >
            Voir les établissements
          </Link>
          
          <Link 
            href="/auth/connexion" 
            className="bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 px-8 rounded-lg text-center border-2 border-gray-300 transition-colors"
          >
            Se connecter
          </Link>
        </div>

        {/* Statistiques */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">250+</div>
            <div className="text-gray-600">Établissements</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">5000+</div>
            <div className="text-gray-600">Réservations</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">4.8/5</div>
            <div className="text-gray-600">Note moyenne</div>
          </div>
        </div>
      </div>
    </main>
  )
}
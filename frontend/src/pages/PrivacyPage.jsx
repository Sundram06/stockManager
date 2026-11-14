import PublicPageLayout from "../component/PublicPageLayout";
import LegalDocument from "../component/legal/LegalDocument";
import { PRIVACY } from "../component/legal/legalContent";

export default function PrivacyPage() {
	return (
		<PublicPageLayout>
			<LegalDocument {...PRIVACY} />
		</PublicPageLayout>
	);
}

import PublicPageLayout from "../component/PublicPageLayout";
import LegalDocument from "../component/legal/LegalDocument";
import { TERMS } from "../component/legal/legalContent";

export default function TermsPage() {
	return (
		<PublicPageLayout>
			<LegalDocument {...TERMS} />
		</PublicPageLayout>
	);
}

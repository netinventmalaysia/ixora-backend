import { Business } from './business.entity';

export function mapBusinessToListItem(business: Business) {
    return {
        id: business.id,
        name: business.companyName,
        // Include raw fields commonly used by the frontend for labels and status
        companyName: business.companyName,
        registrationNumber: business.registrationNumber,
        lamNumber: business.lamNumber,
        lamStatus: business.lamStatus,
        lamDocumentPath: business.lamDocumentPath,
        lamVerifiedAt: business.lamVerifiedAt,
        lamStatusReason: business.lamStatusReason,
        href: `/business/${business.id}`,
        status: business.status,
        createdBy: business.user ? `${business.user.firstName} ${business.user.lastName}` : (business.userId ?? 'Unknown'),
        dueDate: business.createdAt.toLocaleDateString('en-GB'),
        dueDateTime: business.createdAt,
    };
}

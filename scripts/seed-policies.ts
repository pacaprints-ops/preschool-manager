import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { policies } from '../src/lib/db/schema'

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!)
const db = drizzle(sql)

const PARENTAL_PERMISSIONS = `In the unlikely event of an accident or emergency involving my child, emergency services will be called if necessary and I understand my child may be taken to hospital accompanied by a member of staff for emergency treatment and that the staff member will follow medical advice, including options to operate or be given blood — this list is not exhausted.

I give permission for a member of staff who is First Aid trained to administer minor first aid, e.g. plasters, eye wash etc, and to my knowledge my child has had no adverse reactions to these.

I give staff permission to administer sun cream to any exposed skin.

We will change the children if they become wet through toileting or play. We also ensure the children have appropriate layers on both inside and out while under our care and we use our best judgement to do this.

We ask that the children do not wear slip-on shoes or wellies as their footwear in pre-school — shoes must have a strap attaching them to the foot that makes for easy movement. Please can the children be able to put them on and off themselves, no laces. Children must wear socks with all shoe styles. Staff reserve the right to request different footwear.

Although we respect all personal choices around jewellery, the children's safety is our priority. Children are permitted to wear a stud earring per ear and no other jewellery.

I understand my child has a high chance of coming back with my 'learning' all over me so will dress them in non-expensive clothing. We use a variety of equipment; all is washable and child suitable.

On occasion, Winton Pre-School Little Explorers may take short, supervised trips including using public transport. I understand that risk assessments are carried out for each type of trip or outing taken and are available for me to see if required.

As part of the EYFS and recording your child's development we take photos of the children. These are stored on the setting tablets until uploaded to closed parent Facebook group and then deleted.

We may also display photos around the setting for parents to view.

We will use your child's photos on our pre-school Facebook page, where you can keep up to date with what your child is doing. We also may use your child's photos on our school's website.

I am aware of Winton Pre-School Little Explorers policies and procedures and that I may access them at any time by requesting from management.

I agree with Winton Pre-School Little Explorers Behaviour Policy and Suspension and Exclusion Policy.

I understand the pre-school will share relevant information about my child when they transition to another setting/school, or after health checks.

I understand that I am required to give four weeks' notice should I wish to terminate my child's place. If I fail to do this, I will be unable to access the funding at another setting until the four weeks are up. This includes non-funded/private paying families — full fees are due for the notice period.

I understand I must pay for all booked slots and absences are not discounted.

I understand I must pay a consumables charge (please see Funding Policy). Charges still apply if my child is absent.

A two-week holiday is given free of charge if notice is given, and the form is complete prior to holiday. I understand that I can only take two weeks holiday under the funding, any longer may incur charges.

I will notify Winton Pre-School Little Explorers of any absences as soon as possible either by text or a phone call — this isn't regarding charges, this is to ensure you don't receive safeguarding calls enquiring as to your child's attendance.

I will notify Winton Pre-School Little Explorers of any changes that may arise, i.e. change of address, mobile number, parents' childcare arrangements, jobs or any new medical conditions/allergies.

If you don't label your child's items, pre-school staff will.

WPS Little Explorers do not take responsibility for any items that are brought into pre-school. Parents bring in/or allow children to bring in at their own risk. We ask that items are not brought in as it can upset your child if another child takes it. Children are to feel the toys at pre-school are for all children to play with.

You can leave pushchairs outside; they are left at your own risk.

I understand if I am late to collect my child a £5 charge will apply for the first incident of lateness — £5 for the first 15 minutes, any time after this you will be charged £5 for every five minutes. Any further late incidents will be charged at £5 for every 5 minutes straight away. If an emergency occurs, contact the setting as soon as you are aware.

Winton Pre-School Little Explorers reserve the right to allow a reduced number of children into the setting in the event of staff shortages, to ensure legal ratio requirements are met.

Staff will support you and your child in the settling in period, and will discuss with you if we/you feel your child is ready to be left. Staff will not allow children to remain in the setting upset.

Pre-school reserves the right to withdraw a child's place if fees are unpaid, or for other reasons staff feel appropriate — all reasons will be discussed with parents.

You are given a fees sheet, parent information and parent policy overview at the time of registration. You are signing here to say you have received and read them. Staff can use Google Translate if you need help.

We allocate staff and prepare for your child regardless of non-attendance, therefore fees are due for all booked days/slots.

All fees are payable in advance on a daily, weekly or half-termly basis. You will be invoiced half-termly in advance; the usual payment methods are accepted. Late payments will incur a fee. Invoices over two weeks without payment will mean additional services (non-funded hours) will be stopped until the account is brought up to date. You can pay by cash or BACS — details are on the invoices.

Data protection legislation (the Data Protection Act 2018 (the DPA 2018) and UK General Data Protection Regulation (UK GDPR)) does not prevent the sharing of information for the purposes of safeguarding children, when it is necessary, proportionate and justified to do so. This means we do not require your consent if we feel there is a child in danger, as safeguarding is paramount.

Please sign below to indicate that the information given on this form is accurate and correct and that you agree and have read the above information and conditions.`

const INFORMATION_SHARING = `I agree to a member of staff from Winton Pre-School Little Explorers contacting other professionals involved with my child and sharing my details in the best interest of the child.

Exceptions to this permission can be noted when signing below. As part of the transfer of information protocol, relevant information will routinely be passed on to your child's next provision/school.

By signing below, you confirm that you have been informed of the information sharing arrangements as detailed above and that you consent to these arrangements. You understand you have the right to withdraw or restrict your consent to these arrangements at any time by contacting pre-school management.

Your personal information will be held and used in accordance with the requirements of the Data Protection Act 1998 and the GDPR Act 2018. We will use the information you have provided in connection with the administration, collection and processing of statistical data for statutory and non-statutory purposes to central government and local government. By signing this document, you are providing your consent to the pre-school to hold and use your personal information for these purposes. The information you provide may be disclosed internally to other services within BCP Council and to external health professionals, other education authorities, the Department for Education and partner agencies.

WPS Little Explorers will never sell your information. Winton Pre-School Little Explorers are registered with the ICO. For further information about this please ask for a copy of our Data Protection and GDPR Policy.`

const FEES_ACKNOWLEDGEMENT_INTRO = `I confirm that I have read and understood Winton Pre-School Little Explorers' Fees and Funding Policy (below) and agree to adhere to the terms and conditions set out in the policy. I also confirm I have read and understood and agree to all the information given within the registration form.

IMPORTANT — Payment in advance: Fees are payable in advance. Termly invoices must be paid in full by the start of term. We allow one week's grace from the start of term before this becomes overdue.

`

const FEES_POLICY_FULL = `WINTON PRE-SCHOOL LITTLE EXPLORERS — Fees and Funding Policy

This policy will be reviewed regularly. Any changes made to this policy will be shared with parents/carers 4 weeks before any changes are implemented.

Fees are reviewed annually. 2, 3 and 4 year olds may be eligible for the Early Education Funding (EEF) provided by the Local Education Authority.

Our sessions are as follows (subject to availability):
Monday 9.00am–3pm · Tuesday 9.00am–3pm · Wednesday 9.00am–3pm · Thursday 9.00am–3pm
Friday 9.00am–12pm (for those claiming 15 hours of early education funding) or 3pm
Term Time Only.
(To meet the needs of children and their families and support them to claim the full 15 hours funding, subject to availability, other short morning/afternoon sessions may be offered once Friday half days are full.)

Early Education Funding (EEF)
We accept 15 and 30 hour funding entitlement for 2, 3 & 4 year-olds. We also accept private paying children who attend over their funded hours and instead of the funding.
— The 15-hour Early Education funding is paid to the Pre-School from the Local Authority. Those claiming 15 hours can take up their funding over two full days (9am–3pm and one short morning, usually on a Friday 9am–12pm).
— The 30-hour funding is done between yourself and Gov.uk; you will be required to notify us of the code. It is your responsibility to ensure the code remains updated. Those that claim the full 30 hours can do this every day Monday–Friday between 9am–3pm.

All parents will be required to complete a funding declaration form. Where parents fail to keep their funding codes updated and funding is withdrawn, parents will be liable to cover the full cost of their children's hours.

To support your child in their early education, we do request a minimum attendance of 2 days per week.

The LA provides Early Education Funding for 38 weeks of the year, consisting of 15/30 hours per week. The funding can be claimed during opening hours of 9am–3pm between Monday and Friday and is term time only. Funded spaces are available on a first come first served basis. We will try to accommodate hours requested, however these are subject to availability.

The hourly rate for additional fees and consumables from 01/04/2026 will be as follows:
£9.00 per hour for 2 year olds
£8.25 per hour for 3 and 4 year olds

Fees of additional hours must be paid whether the child attends the session or not, i.e. if the child is sick or takes holiday during term time.

For those that are paying fees privately, we charge a £50 enrolment fee which includes a home visit, 3 x settling in sessions and 1 x child's polo shirt.

Consumables Fees = £3.50 per session
This is a voluntary fee paid by parents/carers to support us to deliver high quality early years education above the basic EYFS requirements. An overview of what our Consumables include: suncream and sun hats; trips (local care home, park, local area, bus trips, café visits, local library, beach, and any trips implemented in the moment to extend children's interest and learning); enhanced arts & crafts materials to support celebrations and children's interests (Mother's Day and Father's Day crafts, additional Christmas crafts and parent & child Christmas craft day, additional Easter crafts, any additional craft materials required above the basic to support and extend children's learning and interests in the moment); daily yoga and mindfulness sessions; enhanced messy play above the basic requirements such as slime; annual summer party; graduation ceremony and leavers gifts; school leavers trips; annual Christmas party including children's entertainer; visit from Father Christmas and Christmas gifts; enhanced staff to child ratios; educational materials — additional resources such as books or learning materials used beyond the basic provision; enrichment activities such as caring for our allotment; seasonal snacks such as ice lollies in the summer and hot chocolate and gingerbread in the winter; food tasting activities.

Why do we charge a voluntary consumable fee?
Our consumable fees have enabled us to deliver an enhanced early years provision that delivers above and beyond the basic EYFS requirements. Your child is not just a number, they are part of our WPS family — we pride ourselves on being a friendly, approachable setting that creates a warm welcoming family environment not just for the children, but for their parents and families too.

The basic EYFS requirements state that you only need to have one Paediatric first aid trained member of staff. We ensure that ALL members of staff are Paediatric first aid trained. We have to pay for all of our first aid training and pay staff wages for them to attend in their own time.

We enhance our ratios above the basic minimum requirements. This enables us to deliver above and beyond the basic requirements, such as trips to the local care home, the park, the local area, bus trips, café visits, local library, beach, and any trips implemented in the moment to extend children's interest and learning. This enhanced ratio also enables us to provide free-flow inside and outside all day, and to spend time in our allotment. It also means we can deliver high quality targeted intervention group sessions to those children that may require additional support, such as speech and language sessions. Also we make safeguarding our top priority — having an additional staff member enables us to ensure any personal care given to children (such as nappy changing and supporting at toilet time and supporting potty training) is always done with 2 members of staff present, to safeguard both the child and staff members.

Extended resources — we strive to provide enhanced resources for the children, giving them the opportunity to explore a wide range of media and materials, such as a variety of paints including powder paints, messy glue, shaving foam, slime, compost, sand, jelly, custard, real food items, crushed cereal, cornflour, gloop, bubble bath, bath bombs, science experiment equipment such as bicarbonate of soda, vinegar etc, and ingredients to make playdough (salt and flour). Also extensive craft materials, allowing them to be creative with no limitations, such as a wide range of paper and card, foam, tissue paper, cotton wool balls, googly eyes, lollipop sticks. We also ensure that we provide the tools needed to spark those imaginations — child scissors including double handled scissors to support the children to use them safely, potato mashers, tweezers, different sized paint brushes, stencils, and any equipment needed to support children's particular interests and in-the-moment extending play and learning opportunities. All above the basic requirements of the EYFS.

We strive to have a balanced mix of beautiful resources made from wood and plastic, ensuring there is rotation of high quality resources to keep the children engaged. We also, where possible, provide cooking activities and food tasting opportunities and all the ingredients that go with this, as well as seasonal snacks such as gingerbread, mince pies, hot chocolates, ice creams and ice lollies.

We have outside agencies visit our setting, such as Barney Maths, visits from the dentist and children's entertainers, which all cost money. We also arrange visits from the local authorities such as ambulance, police and fire.

We have daily yoga and mindfulness sessions — this is a really important part of the day that allows us to empower children using positive affirmations.

We have our beautiful allotment, that takes time, love and money invested to make it an extension of our provision. It is an extra classroom that provides children with rich learning opportunities about how to care for and grow their own plants and food, and have the opportunity to be surrounded by nature.

We have summer parties, Christmas parties, a visit from a special you-know-who in December! We give children Christmas gifts. We also pay for a children's entertainer at these parties. We hold a summer graduation and trip for our school leavers every year and give graduation gifts. We invite parents in to share these special milestones — parents are welcome to join us for Christmas craft days, Christmas carol concerts, graduation ceremonies, summer fetes. We hold termly parents' meetings, which staff all give up their own time to do.

For those parents wishing for an alternative option, this can include, but is not limited to: providing your own suncream and hats; providing your own named bag of enhanced craft materials on specific planning weeks and any additional messy play activities beyond the basic EYFS requirements; accompanying your child on trips; on party days, parents can swap their child's funded hours to another session subject to availability; donating enhanced educational materials and enrichment activities. All of this can be discussed with management on an individual basis.

In the event that the Pre-School is closed due to adverse weather e.g. snow, or any other circumstances beyond our control, the following procedures will take place: a note will be put on the door to advise that we are closed; all attempts to contact all parents via telephone and our social media pages. Alternative day or refund of fees will be made in the following order: children receiving government funding will be given the opportunity to attend an alternative day as priority where possible; children who pay additional fees or who are not funded and pay full fees will be offered an alternative day if possible.

If for any reason a child's funding is stopped by the Local Education Authority, it is the responsibility of the child's parent/carer to pay the outstanding fees to Winton Pre-School Little Explorers. Otherwise, their child could lose their place at Winton Pre-School Little Explorers.

All fees are payable in advance on a daily, weekly or half term basis from the 1st day the child starts at Pre-School.

Persistent non-payment of additional fees may result in parents/carers being notified that their child will be removed from the register and therefore unable to attend Winton Pre-School Little Explorers, or hours will be reduced to the funded hours, with no option of additional hours. Every action possible will be taken to continue the provision of education for those families unable to pay fees because of genuine financial difficulties. In exceptional circumstances the directors may elect to waive part payment of fees. This will be reviewed on an individual basis in a meeting held between parents/carers and the directors.

In the event of a child leaving, 4 weeks (term weeks) notice must be given. 4 weeks of Early Education funding will be claimed by us. Private paying fees will also be required to be paid in full during these 4 weeks, regardless of whether your child attends or not.

Only 2 weeks of holiday will be covered by the Early Education Funding (over 3 academic terms) and Parents/Carers will be charged for any additional weeks taken.

If a child is late in being collected from Pre-School at the end of the session, late fee charges will apply. A charge of £5 will be applied for the first 15 minutes on the first incident, and £5 per 5 minutes thereafter. Parents/carers that are consistently late picking up their child will incur a charge of £5 per 5 minutes immediately. Continuous lateness may result in your child's space being withdrawn and/or hours reduced.

The government offers a range of benefits, schemes and entitlements to help towards the cost of childcare, which you may be eligible for. Please visit the BCP (Bournemouth, Christchurch and Poole) Council webpage where you will be able to access information about paying for childcare: https://www.fid.bcpcouncil.gov.uk/family-information-directory/information/childcare`

async function main() {
  await db.insert(policies).values([
    { name: 'Parental Permissions', content: PARENTAL_PERMISSIONS, sortOrder: 1 },
    { name: 'Information Sharing Consent', content: INFORMATION_SHARING, sortOrder: 2 },
    { name: 'Fees & Funding Acknowledgement', content: FEES_ACKNOWLEDGEMENT_INTRO + FEES_POLICY_FULL, sortOrder: 3 },
  ])
  console.log('✓ 3 policies seeded')
}

main()

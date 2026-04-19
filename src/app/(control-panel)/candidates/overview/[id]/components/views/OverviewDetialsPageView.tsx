'use client';

import { useMemo, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
    Alert,
    Avatar,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Paper,
    Typography,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import useNavigate from '@fuse/hooks/useNavigate';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { 
    getCandidate, 
    getCandidateProfExpById, 
    getCandidateEducationsById,
    updateProfileExp,
    addProfileExp 
} from '@/api/services/candidates';
const Root = styled(FusePageSimple)(({ theme }) => ({
    '& .FusePageSimple-header': {
        backgroundColor: theme.vars.palette.background.paper,
        borderBottomWidth: 1,
        borderStyle: 'solid',
        borderColor: theme.vars.palette.divider
    },
    '& .FusePageSimple-contentWrapper': {
        backgroundColor: '#f8fafc', // Light slate background like the screenshot
        paddingTop: theme.spacing(2)
    }
}));

type Props = {
    cid: string;
};

function OverviewDetailsPageView({ cid }: Props) {
    const { isReady } = useUser();
    const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
    const navigate = useNavigate();

    // Mocking the data based on your JSON structure
    const { data: candidate, isLoading, error } = useQuery({
        queryKey: ['candidate-overview', cid],
        queryFn: async () => {
            // Replace with: return getCandidateById(cid);
            return {
                Cid: 31694,
                FirstName: "Towhid",
                LastName: "Zaman",
                Email: "test@gmail.com",
                Phone: "01521541218",
                Gender: 1,
                Created: "2026-04-08T03:59:20.626012",
                AvailabilityStatus: 0,
                Tags: null,
                Languages: [],
            };
        },
        enabled: isReady && Boolean(cid)
    });

    const fullName = useMemo(() => {
        return candidate ? `${candidate.FirstName} ${candidate.LastName}` : '';
    }, [candidate]);

    if (!isReady) return <FuseLoading />;

    return (
        <Root
            header={
                <div className="flex items-center gap-4 p-6">
                    <div className="flex flex-col">
                        <Typography variant="h6" className="font-semibold">
                            Candidate/ <span className="text-gray-500">{fullName}</span>
                        </Typography>
                        <PageBreadcrumb />
                    </div>
                </div>
            }
            content={
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center p-12"><CircularProgress /></div>
                    ) : (
                        <div className="grid grid-cols-12 gap-6">
                            
                            {/* LEFT SIDEBAR - PROFILE & DETAILS */}
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
                                <Paper className="rounded-xl p-8 flex flex-col items-center text-center relative" variant="outlined">
                                    <Avatar className="h-24 w-24 mb-4 text-3xl font-bold bg-gray-200">
                                        <FuseSvgIcon size={48} className="text-gray-400">lucide:user</FuseSvgIcon>
                                    </Avatar>
                                    <Typography variant="h6" className="font-bold flex items-center gap-2">
                                        {fullName} <FuseSvgIcon size={16} className="text-gray-400">lucide:copy</FuseSvgIcon>
                                    </Typography>
                                    <Chip label="Status not set" size="small" className="mt-2 bg-orange-50 text-orange-600 border border-orange-100" />
                                    
                                    <div className="flex gap-4 mt-6">
                                        <IconButton className="bg-blue-50 text-blue-600" size="small"><FuseSvgIcon size={18}>lucide:history</FuseSvgIcon></IconButton>
                                        <IconButton className="bg-purple-50 text-purple-600" size="small"><FuseSvgIcon size={18}>lucide:mail</FuseSvgIcon></IconButton>
                                        <IconButton className="bg-blue-50 text-blue-600" size="small"><FuseSvgIcon size={18}>lucide:file-text</FuseSvgIcon></IconButton>
                                    </div>

                                    <div className="w-full mt-8 space-y-4 text-left">
                                        <div className="flex items-center justify-between">
                                            <Typography variant="caption" className="font-bold text-gray-400">DETAILS</Typography>
                                            <IconButton size="small"><FuseSvgIcon size={16}>lucide:edit-3</FuseSvgIcon></IconButton>
                                        </div>
                                        <DetailRow icon="lucide:user" label="Full Name" value={fullName} />
                                        <DetailRow icon="lucide:mail" label="Email" value={candidate?.Email} />
                                        <DetailRow icon="lucide:phone" label="Phone Number" value={candidate?.Phone} />
                                        
                                        <Typography variant="caption" className="font-bold text-gray-400 block pt-4">Other Information</Typography>
                                        <DetailRow label="Gender" value={candidate?.Gender === 1 ? 'Male' : 'Female'} />
                                    </div>
                                </Paper>

                                <Paper className="rounded-xl overflow-hidden" variant="outlined">
                                    <Accordion defaultExpanded elevation={0}>
                                        <AccordionSummary expandIcon={<FuseSvgIcon>lucide:chevron-down</FuseSvgIcon>}>
                                            <Typography className="font-bold text-sm">Tags</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Typography variant="caption" className="text-gray-400">No tags added.</Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                </Paper>
                            </div>

                            {/* RIGHT CONTENT - ACCORDIONS & FORMS */}
                            <div className="col-span-12 md:col-span-8 flex flex-col gap-4">
                                
                                {/* Header Toggle Bar */}
                                <Paper className="p-2 flex items-center justify-between bg-[#1e4e79] text-white rounded-lg" elevation={0}>
                                    <div className="flex items-center gap-2 px-2">
                                        <FuseSvgIcon size={20}>lucide:book-open</FuseSvgIcon>
                                        <Typography className="text-sm font-bold">Master</Typography>
                                        <div className="w-10 h-5 bg-blue-400 rounded-full relative ml-2 cursor-pointer">
                                            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                                        </div>
                                        <Typography className="text-sm">Publish</Typography>
                                    </div>
                                    <Button color="inherit" endIcon={<FuseSvgIcon>lucide:chevron-down</FuseSvgIcon>} className="capitalize">
                                        Candidate's Profile
                                    </Button>
                                </Paper>

                                <Paper className="p-6 rounded-xl" variant="outlined">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <Typography variant="h6" className="font-bold">{fullName}</Typography>
                                            <Typography variant="caption" className="text-blue-500 font-medium">Expected Salary: <span className="text-gray-500">Not Specified</span></Typography>
                                        </div>
                                        <IconButton size="small"><FuseSvgIcon size={18}>lucide:settings</FuseSvgIcon></IconButton>
                                    </div>
                                </Paper>

                                {/* Modular Sections (Forms to be implemented later) */}
                                <SectionAccordion title="Summary Assessment" icon="lucide:edit-3" />
                                <SectionAccordion title="Professional Experiences" icon="lucide:plus" />
                                <SectionAccordion title="Educations" icon="lucide:plus" />
                                <SectionAccordion title="Certificates" icon="lucide:plus" />
                                <SectionAccordion title="Reference" icon="lucide:plus" />
                                <SectionAccordion title="Skills" icon="lucide:plus" />

                            </div>
                        </div>
                    )}
                </div>
            }
        />
    );
}

// Reusable Detail Row Component for Sidebar
function DetailRow({ icon, label, value }: { icon?: string, label: string, value?: string }) {
    return (
        <div className="flex items-start gap-3">
            {icon && <FuseSvgIcon size={20} className="text-gray-400 mt-1">{icon}</FuseSvgIcon>}
            <div className="flex-1">
                <Typography variant="caption" className="text-gray-400 block">{label}</Typography>
                <Typography variant="body2" className="font-medium">{value || 'N/A'}</Typography>
            </div>
            {icon === 'lucide:mail' && <IconButton size="small"><FuseSvgIcon size={14}>lucide:more-horizontal</FuseSvgIcon></IconButton>}
        </div>
    );
}

// Reusable Accordion for the Right side Sections
function SectionAccordion({ title, icon }: { title: string, icon: string }) {
    return (
        <Paper className="rounded-xl overflow-hidden" variant="outlined">
            <Accordion elevation={0}>
                <AccordionSummary 
                    expandIcon={<FuseSvgIcon className="text-gray-400">lucide:chevron-down</FuseSvgIcon>}
                    sx={{ '& .MuiAccordionSummary-content': { justifyContent: 'space-between', alignItems: 'center' } }}
                >
                    <Typography className="font-bold text-gray-700 text-sm">{title}</Typography>
                    <IconButton size="small" className="mr-2"><FuseSvgIcon size={18}>{icon}</FuseSvgIcon></IconButton>
                </AccordionSummary>
                <AccordionDetails className="bg-gray-50 border-t">
                    <div className="py-4 flex flex-col gap-4">
                        <Typography variant="caption" className="text-gray-400 italic">Form for {title} will be integrated here.</Typography>
                        {/* Placeholder for future API integration forms */}
                        <TextField fullWidth label={`Enter ${title} Detail`} variant="outlined" size="small" />
                        <div className="flex justify-end gap-2">
                             <Button size="small" variant="outlined">Cancel</Button>
                             <Button size="small" variant="contained" className="bg-[#1e4e79]">Save</Button>
                        </div>
                    </div>
                </AccordionDetails>
            </Accordion>
        </Paper>
    );
}

export default OverviewDetailsPageView;